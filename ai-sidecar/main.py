from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import uuid
import shutil
import os
import asyncio
import multiprocessing
import subprocess
from playwright.sync_api import sync_playwright
from notebooklm import NotebookLMClient

app = FastAPI()


class VideoResponse(BaseModel):
    task_id: str
    status: str


tasks = {}


def isolated_process_download(video_url: str, task_id: str, download_directory: str, return_dict: dict):
    """Runs in a completely separate Python OS process and compresses the video."""
    try:
        with sync_playwright() as p:
            print(f"[{task_id}] [Process] Launching headless Chromium...")
            browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
            auth_state_path = os.path.expanduser("~/.notebooklm/storage_state.json")

            context = browser.new_context(
                storage_state=auth_state_path,
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()

            print(f"[{task_id}] [Process] Navigating to Notebook UI...")
            page.goto(video_url, wait_until="domcontentloaded")

            if "accounts.google.com" in page.url or "signin" in page.url:
                browser.close()
                return_dict['success'] = False
                return_dict['result'] = "Google Auth Expired. Please run 'notebooklm login' again."
                return

            print(f"[{task_id}] [Process] Locating the newest 'More Options' (three dots) menu...")

            more_btn = page.locator('button.artifact-more-button[aria-label="More"]').first
            more_btn.wait_for(state="visible", timeout=30000)
            more_btn.click(force=True)

            print(f"[{task_id}] [Process] Menu opened. Waiting for the Download option...")
            page.wait_for_timeout(1000)

            download_btn = page.locator('span.mat-mdc-menu-item-text:has-text("Download")').first
            print(f"[{task_id}] [Process] Clicking Download and awaiting file stream...")

            with page.expect_download(timeout=60000) as download_info:
                download_btn.click(force=True)

            download = download_info.value

            # --- THE COMPRESSION UPGRADE ---
            raw_video_path = os.path.join(download_directory, f"{task_id}_raw.mp4")
            final_video_path = os.path.join(download_directory, f"{task_id}.mp4")

            print(f"[{task_id}] [Process] Saving massive raw file to hard drive...")
            download.save_as(raw_video_path)
            browser.close()

            print(f"[{task_id}] [Process] Crushing video size with FFmpeg...")
            try:
                # This FFmpeg command reduces the video quality slightly (crf 32) and compresses the audio,
                # which is perfect for AI-generated informational videos, slashing the size by up to 90%.
                command = [
                    "ffmpeg", "-y", "-i", raw_video_path,
                    "-vcodec", "libx264", "-crf", "32", "-preset", "veryfast",
                    "-c:a", "aac", "-b:a", "64k",
                    final_video_path
                ]

                # Run the compression process
                subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

                # Delete the massive raw file to save server space
                if os.path.exists(raw_video_path):
                    os.remove(raw_video_path)

                print(f"[{task_id}] [Process] Compression complete!")

            except Exception as ffmpeg_err:
                print(
                    f"[{task_id}] [Process] WARNING: FFmpeg failed or isn't installed properly. Using original file. Error: {ffmpeg_err}")
                # Fallback: If FFmpeg fails, just rename the raw file to the final name so the app doesn't break
                os.rename(raw_video_path, final_video_path)
            # -------------------------------

            return_dict['success'] = True
            return_dict['result'] = final_video_path

    except Exception as e:
        return_dict['success'] = False
        return_dict['result'] = str(e)


async def execute_notebooklm_generation(task_id: str, text_content: str, file_path: str, temp_dir: str,
                                        course_title: str, course_id: str, module_title: str):
    try:
        async with await NotebookLMClient.from_storage() as client:

            target_notebook_name = f"{course_title} - ID:{course_id}"

            print(f"[{task_id}] Searching for existing Course Notebook: '{target_notebook_name}'...")
            notebooks = await client.notebooks.list()
            nb = next((n for n in notebooks if n.title == target_notebook_name), None)

            if not nb:
                print(f"[{task_id}] Not found. Creating new notebook for this course...")
                nb = await client.notebooks.create(target_notebook_name)
            else:
                print(f"[{task_id}] Notebook found! Entering existing course notebook...")

            # 1. Record existing sources
            existing_sources = await client.sources.list(nb.id)
            # Handle the empty/None edge case gracefully
            if existing_sources is None:
                existing_sources = []
            existing_ids = {getattr(s, 'id', '') for s in existing_sources}

            uploaded_something = False

            # 2. Upload PDF
            if file_path and os.path.exists(file_path):
                print(f"[{task_id}] Uploading PDF with original name...")
                await client.sources.add_file(nb.id, file_path)
                uploaded_something = True

            # 3. Upload Text
            if text_content and text_content.strip():
                print(f"[{task_id}] Uploading textual content as '{module_title}'...")
                await client.sources.add_text(nb.id, module_title, text_content)
                uploaded_something = True

            if not uploaded_something:
                tasks[task_id] = {"status": "FAILED", "error": "No content provided"}
                return

            await asyncio.sleep(2)

            # 4. Fetch the updated list of sources
            updated_sources = await client.sources.list(nb.id)
            if updated_sources is None:
                updated_sources = []
            new_source_ids = [getattr(s, 'id', '') for s in updated_sources if getattr(s, 'id', '') not in existing_ids]

            # 5. Snapshot existing videos BEFORE triggering generation
            print(f"[{task_id}] Taking snapshot of older videos to prevent premature downloads...")
            existing_artifacts = await client.artifacts.list(nb.id)
            if existing_artifacts is None:
                existing_artifacts = []
            existing_video_ids = {getattr(a, 'id', '') for a in existing_artifacts if
                                  "VIDEO" in str(getattr(a, 'kind', ''))}

            # 6. Generate Video Logic
            if len(existing_ids) == 0:
                print(f"[{task_id}] Brand new notebook detected. Triggering standard unfiltered generation...")
                await client.artifacts.generate_video(nb.id)
            else:
                print(f"[{task_id}] Triggering NotebookLM video ONLY for new sources: {new_source_ids}...")
                try:
                    await client.artifacts.generate_video(nb.id, source_ids=new_source_ids)
                except TypeError:
                    # Safe fallback if the library wrapper expects a different keyword argument
                    await client.artifacts.generate_video(nb.id, source_document_ids=new_source_ids)

            print(f"[{task_id}] Polling Google for the rendered video. Waiting for Status 3 (Completed)...")

            video_url = None
            max_wait_time = 1200
            poll_interval = 20
            elapsed_time = 0

            while elapsed_time < max_wait_time:
                try:
                    artifacts = await client.artifacts.list(nb.id)
                    if artifacts is None:
                        artifacts = []

                    for a in artifacts:
                        kind_str = str(getattr(a, 'kind', ''))
                        status_code = getattr(a, 'status', 0)
                        artifact_id = getattr(a, 'id', '')

                        # Ensure the video is Completed AND its ID was not in the older snapshot!
                        if "VIDEO" in kind_str and status_code == 3 and artifact_id not in existing_video_ids:
                            raw_url = getattr(a, 'url', None)
                            video_url = raw_url if raw_url else f"https://notebooklm.google.com/notebook/{nb.id}"
                            break

                    if video_url:
                        break

                except Exception as e:
                    print(f"[{task_id}] Minor network hiccup: {e}. Continuing...")

                await asyncio.sleep(poll_interval)
                elapsed_time += poll_interval

            if video_url:
                print(f"[{task_id}] Target URL secured: {video_url}")
                print(f"[{task_id}] Delegating to completely isolated OS Process...")

                # download_directory = os.path.abspath("../integrated_backend_fixed/uploads/videos")
                download_directory = os.path.abspath("../backend/uploads/videos")
                os.makedirs(download_directory, exist_ok=True)

                manager = multiprocessing.Manager()
                return_dict = manager.dict()

                p = multiprocessing.Process(
                    target=isolated_process_download,
                    args=(video_url, task_id, download_directory, return_dict)
                )
                p.start()

                while p.is_alive():
                    await asyncio.sleep(1)

                p.join()

                success = return_dict.get('success', False)
                result = return_dict.get('result', "Process failed silently")

                if success:
                    print(f"[{task_id}] Successfully downloaded to: {result}")
                    local_url = f"/uploads/videos/{task_id}.mp4"
                    tasks[task_id] = {
                        "status": "COMPLETED",
                        "url": local_url
                    }
                else:
                    print(f"[{task_id}] Browser download automation failed: {result}")
                    tasks[task_id] = {
                        "status": "COMPLETED",
                        "url": video_url
                    }

            else:
                print(f"[{task_id}] Timeout reached without finding a completed video.")
                tasks[task_id] = {
                    "status": "FAILED",
                    "error": "Video generation timed out."
                }

    except Exception as e:
        print(f"[{task_id}] CRITICAL ERROR: {e}")
        tasks[task_id] = {
            "status": "FAILED",
            "error": str(e)
        }
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


@app.post("/api/ai/generate-video", response_model=VideoResponse)
async def trigger_video_generation(
        background_tasks: BackgroundTasks,
        content: Optional[str] = Form(None),
        file: Optional[UploadFile] = File(None),
        course_title: str = Form(...),
        course_id: str = Form(...),
        module_title: str = Form(...)
):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "PROCESSING", "url": None, "error": None}

    file_path = None
    temp_dir = f"./tmp_upload_{task_id}"

    if file:
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    background_tasks.add_task(execute_notebooklm_generation, task_id, content, file_path, temp_dir, course_title,
                              course_id, module_title)
    return {"task_id": task_id, "status": "PROCESSING"}


@app.get("/api/ai/video-status/{task_id}")
async def get_video_status(task_id: str):
    return tasks.get(task_id, {"status": "NOT_FOUND"})
import base64
import os
import tempfile
import subprocess
import traceback
from typing import Optional

import librosa
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from rapidfuzz import fuzz
from faster_whisper import WhisperModel

app = FastAPI(title="Voice Analysis Service")

model = WhisperModel("base", device="cpu", compute_type="int8")


class VoiceAnalysisRequestDto(BaseModel):
    expectedText: str
    expectedVoiceStyle: str
    minimumPassingScore: int
    audioBase64: str
    originalFilename: Optional[str] = None
    contentType: Optional[str] = None


class VoiceAnalysisResultDto(BaseModel):
    transcript: str
    detectedVoiceStyle: str
    textScore: int
    energyScore: int
    paceScore: int
    stabilityScore: int
    pitchScore: int
    finalScore: int
    accepted: bool
    feedback: str


def decode_audio_to_temp_file(audio_b64: str, original_filename: Optional[str] = None) -> str:
    raw = base64.b64decode(audio_b64)

    suffix = ".webm"
    if original_filename:
        lower = original_filename.lower()
        if lower.endswith(".mp3"):
            suffix = ".mp3"
        elif lower.endswith(".wav"):
            suffix = ".wav"
        elif lower.endswith(".ogg"):
            suffix = ".ogg"
        elif lower.endswith(".m4a"):
            suffix = ".m4a"
        elif lower.endswith(".webm"):
            suffix = ".webm"

    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)

    with open(path, "wb") as f:
        f.write(raw)

    return path


def convert_to_wav(input_path: str) -> str:
    fd, output_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)

    command = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ar", "16000",
        "-ac", "1",
        output_path
    ]

    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr}")

    return output_path


def load_audio(path: str):
    wav_path = convert_to_wav(path)
    y, sr = librosa.load(wav_path, sr=16000, mono=True)
    if y.size == 0:
        raise ValueError("Empty audio")
    return y, sr, wav_path


def transcribe_audio(path: str) -> str:
    segments, _ = model.transcribe(path)
    text = " ".join(segment.text.strip() for segment in segments).strip()
    return text


def normalize_score(value: float, low: float, high: float) -> int:
    if value <= low:
        return 0
    if value >= high:
        return 100
    return int(round(((value - low) / (high - low)) * 100))


def compute_energy_score(y: np.ndarray) -> int:
    rms = librosa.feature.rms(y=y)[0]
    mean_rms = float(np.mean(rms))
    return normalize_score(mean_rms, 0.01, 0.12)


def compute_pace_score(duration_sec: float, word_count: int, style: str) -> int:
    if duration_sec <= 0.1:
        return 0

    wps = word_count / duration_sec
    style = style.upper()

    if style == "CALM":
        target = 1.7
        tolerance = 0.8
    elif style == "HAPPY":
        target = 2.5
        tolerance = 1.0
    elif style == "COURAGEOUS":
        target = 2.2
        tolerance = 0.8
    elif style == "SOFT":
        target = 1.8
        tolerance = 0.7
    else:
        target = 2.1
        tolerance = 0.8

    diff = abs(wps - target)
    score = max(0.0, 100.0 - (diff / tolerance) * 100.0)
    return int(round(min(100.0, score)))


def compute_stability_score(y: np.ndarray, sr: int) -> int:
    frame_length = 2048
    hop_length = 512
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    if rms.size == 0:
        return 0
    std_val = float(np.std(rms))
    score = 100 - normalize_score(std_val, 0.005, 0.08)
    return max(0, min(100, score))


def compute_pitch_score(y: np.ndarray, sr: int, style: str) -> int:
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    selected = []

    for i in range(pitches.shape[1]):
        index = magnitudes[:, i].argmax()
        pitch = pitches[index, i]
        if pitch > 50:
            selected.append(pitch)

    if not selected:
        return 40

    mean_pitch = float(np.mean(selected))
    style = style.upper()

    if style == "CALM":
        target_low, target_high = 140, 220
    elif style == "HAPPY":
        target_low, target_high = 180, 320
    elif style == "COURAGEOUS":
        target_low, target_high = 150, 260
    elif style == "SOFT":
        target_low, target_high = 140, 220
    else:
        target_low, target_high = 150, 260

    if target_low <= mean_pitch <= target_high:
        return 90

    diff = target_low - mean_pitch if mean_pitch < target_low else mean_pitch - target_high
    penalty = min(80, int(diff / 2))
    return max(20, 90 - penalty)


def compute_text_score(expected_text: str, transcript: str) -> int:
    if not transcript.strip():
        return 0
    return int(round(fuzz.ratio(expected_text.lower().strip(), transcript.lower().strip())))


def detect_voice_style(energy_score: int, pace_score: int, stability_score: int, pitch_score: int) -> str:
    if energy_score >= 70 and pace_score >= 65 and pitch_score >= 65:
        return "HAPPY"
    if energy_score >= 65 and stability_score >= 70:
        return "COURAGEOUS"
    if energy_score <= 60 and stability_score >= 70:
        return "CALM"
    if energy_score <= 58 and stability_score >= 68:
        return "SOFT"
    return "ENCOURAGING"


def compute_final_score(style: str, text_score: int, energy_score: int, pace_score: int, stability_score: int, pitch_score: int) -> int:
    base = (
        text_score * 0.40 +
        energy_score * 0.15 +
        pace_score * 0.15 +
        stability_score * 0.15 +
        pitch_score * 0.15
    )

    bonus = 0
    style = style.upper()

    if style == "CALM":
        if 40 <= energy_score <= 70:
            bonus += 4
        if stability_score >= 70:
            bonus += 5
    elif style == "HAPPY":
        if energy_score >= 70:
            bonus += 5
        if pace_score >= 65:
            bonus += 4
    elif style == "COURAGEOUS":
        if energy_score >= 65:
            bonus += 5
        if stability_score >= 70:
            bonus += 5
    elif style == "SOFT":
        if energy_score <= 65:
            bonus += 4
        if stability_score >= 68:
            bonus += 4
    else:
        if stability_score >= 65:
            bonus += 3

    final_score = int(round(base + bonus))
    return max(0, min(100, final_score))


def build_feedback(expected_style: str, accepted: bool) -> str:
    expected_style = expected_style.upper()

    if accepted:
        if expected_style == "CALM":
            return "Great job. Your tone felt calm and steady."
        if expected_style == "HAPPY":
            return "Well done. Your voice sounded lively and bright."
        if expected_style == "COURAGEOUS":
            return "Beautiful. Your voice sounded confident and strong."
        if expected_style == "SOFT":
            return "Well done. Your delivery felt gentle and soothing."
        return "Great job. Your tone matched the expected style well."

    if expected_style == "CALM":
        return "Try again with a slower and steadier tone."
    if expected_style == "HAPPY":
        return "Try again with more brightness and energy."
    if expected_style == "COURAGEOUS":
        return "Try again with a firmer and more confident tone."
    if expected_style == "SOFT":
        return "Try again with a softer and gentler delivery."
    return "Try again and match the target style a little more closely."


@app.post("/analyze-voice-style", response_model=VoiceAnalysisResultDto)
def analyze_voice_style(request: VoiceAnalysisRequestDto):
    temp_path = None
    wav_path = None

    try:
        temp_path = decode_audio_to_temp_file(request.audioBase64, request.originalFilename)
        y, sr, wav_path = load_audio(temp_path)
        transcript = transcribe_audio(wav_path)

        duration_sec = librosa.get_duration(y=y, sr=sr)
        word_count = len([w for w in transcript.split() if w.strip()])

        text_score = compute_text_score(request.expectedText, transcript)
        energy_score = compute_energy_score(y)
        pace_score = compute_pace_score(duration_sec, word_count, request.expectedVoiceStyle)
        stability_score = compute_stability_score(y, sr)
        pitch_score = compute_pitch_score(y, sr, request.expectedVoiceStyle)

        detected_style = detect_voice_style(energy_score, pace_score, stability_score, pitch_score)
        final_score = compute_final_score(
            request.expectedVoiceStyle,
            text_score,
            energy_score,
            pace_score,
            stability_score,
            pitch_score
        )

        accepted = final_score >= request.minimumPassingScore
        feedback = build_feedback(request.expectedVoiceStyle, accepted)

        return VoiceAnalysisResultDto(
            transcript=transcript,
            detectedVoiceStyle=detected_style,
            textScore=text_score,
            energyScore=energy_score,
            paceScore=pace_score,
            stabilityScore=stability_score,
            pitchScore=pitch_score,
            finalScore=final_score,
            accepted=accepted,
            feedback=feedback
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Voice analysis failed: {str(e)}")

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)
import asyncio
from notebooklm import NotebookLMClient

async def check_notebook():
    print("Connecting to NotebookLM...")
    try:
        async with await NotebookLMClient.from_storage() as client:
            # Get all your notebooks
            notebooks = await client.notebooks.list()
            
            if not notebooks:
                print("No notebooks found in your account.")
                return
            
            # Just grab the very newest notebook (Index 0)
            target_nb = notebooks[0]
            
            print(f"Found newest Notebook with ID: {target_nb.id}")
            print("Fetching items inside it...\n")
            
            artifacts = await client.artifacts.list(target_nb.id)
            
            if not artifacts:
                print("This notebook is completely empty.")
                
            for i, a in enumerate(artifacts):
                print(f"--- Item {i+1} ---")
                
                # Safely get the kind
                kind = getattr(a, 'kind', 'UNKNOWN')
                print(f"KIND (The Secret Label): '{kind}'")
                
                # Safely get the url
                url = getattr(a, 'url', None)
                print(f"Has URL?: {'Yes -> ' + url if url else 'No URL attached yet'}")
                
                # Print all raw data to be absolutely sure
                raw_data = a.__dict__ if hasattr(a, '__dict__') else a
                print(f"Raw Data: {raw_data}\n")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_notebook())
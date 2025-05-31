from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from focus_detector import is_focused

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze_focus/")
async def analyze_focus(file: UploadFile = File(...)):
    contents = await file.read()
    focused = is_focused(contents)
    return {"focused": focused}

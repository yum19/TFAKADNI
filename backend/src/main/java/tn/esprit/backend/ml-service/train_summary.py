"""
train_summary.py  –  Lightweight summarization config, no torch required.
"""

import joblib
import os

SUMMARY_MODEL_PATH = "summary_model.pkl"


def train():
    print("[summary] Setting up lightweight summarization config...")
    model_data = {
        "type":    "sumy_lsa",
        "version": "1.0",
    }
    joblib.dump(model_data, SUMMARY_MODEL_PATH)
    print(f"[summary] Config saved ✅")
    return model_data


if __name__ == "__main__":
    train()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from clasificador import calcular_porcentaje_autoras

app = FastAPI(title="Gender Scholar API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AutoresRequest(BaseModel):
    autores: List[str]

@app.post("/clasificar")
def clasificar_autores(data: AutoresRequest):
    return calcular_porcentaje_autoras(data.autores)

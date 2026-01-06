import json
import unicodedata
import re
import gender_guesser.detector as gender

def cargar_json(ruta):
    with open(ruta, "r", encoding="utf-8") as f:
        return json.load(f)

NOMBRES_INDIGENAS = cargar_json("data/nombres_indigenas.json")
detector = gender.Detector(case_sensitive=False)

def normalizar_nombre(nombre: str) -> str:
    nombre = nombre.strip().lower()
    nombre = unicodedata.normalize("NFD", nombre)
    nombre = nombre.encode("ascii", "ignore").decode("utf-8")
    nombre = re.sub(r"[^a-z\s]", "", nombre)
    return nombre

def obtener_primer_nombre(nombre: str) -> str:
    nombre_normalizado = normalizar_nombre(nombre)
    partes = nombre_normalizado.split()
    return partes[0] if partes else ""


def clasificar_nombre(nombre: str):
    primer_nombre = obtener_primer_nombre(nombre)

    if not primer_nombre:
        return "Desconocido", 0.0, "Sin nombre"

    if primer_nombre in NOMBRES_INDIGENAS:
        d = NOMBRES_INDIGENAS[primer_nombre]
        return d["genero"], d["confianza"], "Diccionario indígena"

    resultado = detector.get_gender(primer_nombre)

    if resultado == "female":
        return "Mujer", 0.95, "Modelo estadístico"
    elif resultado == "mostly_female":
        return "Mujer", 0.75, "Modelo estadístico"
    elif resultado == "male":
        return "Hombre", 0.95, "Modelo estadístico"
    elif resultado == "mostly_male":
        return "Hombre", 0.75, "Modelo estadístico"
    else:
        return "Desconocido", 0.30, "Nombre ambiguo o poco común"

def calcular_porcentaje_autoras(lista_nombres):
    total_validos = 0
    mujeres = hombres = desconocidos = 0
    detalle = []

    for nombre in lista_nombres:
        genero, confianza, fuente = clasificar_nombre(nombre)

        if genero != "Desconocido":
            total_validos += 1

        if genero == "Mujer":
            mujeres += 1
        elif genero == "Hombre":
            hombres += 1
        else:
            desconocidos += 1

        detalle.append({
            "nombre": nombre,
            "genero": genero,
            "confianza": confianza,
            "fuente": fuente
        })

    porcentaje_mujeres = (mujeres / total_validos * 100) if total_validos > 0 else 0

    return {
        "total_autores_validos": total_validos,
        "mujeres": mujeres,
        "hombres": hombres,
        "desconocidos": desconocidos,
        "porcentaje_mujeres": round(porcentaje_mujeres, 2),
        "detalle": detalle
    }

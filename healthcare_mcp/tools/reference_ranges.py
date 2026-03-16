"""
tools/reference_ranges.py
--------------------------
MCP tool: get_medical_reference_ranges

Returns a static, structured dictionary of standard medical reference ranges
based on widely-accepted clinical guidelines (AHA/ACC, ADA, WHO, etc.).

The LLM uses these values to interpret patient lab reports without needing
to retrieve them from the database.
"""

import logging
from typing import Any

from mcp.server.fastmcp import FastMCP

logger = logging.getLogger(__name__)


def register_tools(mcp: FastMCP) -> None:
    """Register the get_medical_reference_ranges tool with the MCP server instance."""

    @mcp.tool()
    def get_medical_reference_ranges() -> dict[str, Any]:
        """
        Return standard medical reference ranges for common health metrics.

        Use this tool when interpreting patient lab reports, health screenings,
        or explaining what specific test values mean. The data is sourced from
        established clinical guidelines (AHA/ACC 2017, ADA 2024, WHO).

        No input required.

        Returns:
            A structured dict covering: blood_pressure, ldl_cholesterol,
            hdl_cholesterol, total_cholesterol, triglycerides,
            blood_sugar_fasting, blood_sugar_postprandial, hba1c,
            hemoglobin, bmi, creatinine, tsh, wbc, platelet_count.
        """
        logger.info("Tool called: get_medical_reference_ranges")

        return {
            "blood_pressure": {
                "normal":             "120/80 mmHg",
                "elevated":           "120–129 / <80 mmHg",
                "high_stage_1":       "130–139 / 80–89 mmHg",
                "high_stage_2":       ">=140 / >=90 mmHg",
                "hypertensive_crisis": ">180 / >120 mmHg",
                "unit":               "mmHg",
                "guideline":          "AHA/ACC 2017",
            },
            "ldl_cholesterol": {
                "optimal":        "<100 mg/dL",
                "near_optimal":   "100–129 mg/dL",
                "borderline_high":"130–159 mg/dL",
                "high":           "160–189 mg/dL",
                "very_high":      ">=190 mg/dL",
                "unit":           "mg/dL",
            },
            "hdl_cholesterol": {
                "protective":     ">=60 mg/dL",
                "borderline":     "40–59 mg/dL",
                "low_risk_factor":"<40 mg/dL",
                "unit":           "mg/dL",
                "note":           "Higher HDL is cardioprotective",
            },
            "total_cholesterol": {
                "desirable":      "<200 mg/dL",
                "borderline_high":"200–239 mg/dL",
                "high":           ">=240 mg/dL",
                "unit":           "mg/dL",
            },
            "triglycerides": {
                "normal":         "<150 mg/dL",
                "borderline_high":"150–199 mg/dL",
                "high":           "200–499 mg/dL",
                "very_high":      ">=500 mg/dL",
                "unit":           "mg/dL",
            },
            "blood_sugar_fasting": {
                "normal":         "70–100 mg/dL",
                "prediabetes":    "100–125 mg/dL",
                "diabetes":       ">=126 mg/dL",
                "unit":           "mg/dL",
                "note":           "Measured after >=8 hours of fasting",
            },
            "blood_sugar_postprandial": {
                "normal":         "<140 mg/dL",
                "prediabetes":    "140–199 mg/dL",
                "diabetes":       ">=200 mg/dL",
                "unit":           "mg/dL",
                "note":           "Measured 2 hours after eating",
            },
            "hba1c": {
                "normal":         "<5.7%",
                "prediabetes":    "5.7–6.4%",
                "diabetes":       ">=6.5%",
                "unit":           "%",
                "note":           "Reflects average blood sugar over 2–3 months",
                "guideline":      "ADA 2024",
            },
            "hemoglobin": {
                "male_normal":    "13.5–17.5 g/dL",
                "female_normal":  "12.0–15.5 g/dL",
                "mild_anemia":    "10.0–12.0 g/dL",
                "moderate_anemia":"8.0–10.0 g/dL",
                "severe_anemia":  "<8.0 g/dL",
                "unit":           "g/dL",
            },
            "bmi": {
                "underweight":    "<18.5",
                "normal":         "18.5–24.9",
                "overweight":     "25.0–29.9",
                "obese_class_1":  "30.0–34.9",
                "obese_class_2":  "35.0–39.9",
                "obese_class_3":  ">=40.0",
                "unit":           "kg/m²",
                "guideline":      "WHO",
            },
            "creatinine": {
                "male_normal":    "0.74–1.35 mg/dL",
                "female_normal":  "0.59–1.04 mg/dL",
                "unit":           "mg/dL",
                "note":           "Elevated values may indicate kidney impairment",
            },
            "tsh": {
                "normal":         "0.4–4.0 mIU/L",
                "hypothyroidism": ">4.0 mIU/L",
                "hyperthyroidism":"<0.4 mIU/L",
                "unit":           "mIU/L",
            },
            "wbc": {
                "normal":         "4,500–11,000 cells/mcL",
                "leukopenia":     "<4,500 cells/mcL",
                "leukocytosis":   ">11,000 cells/mcL",
                "unit":           "cells/mcL",
            },
            "platelet_count": {
                "normal":         "150,000–400,000 per mcL",
                "thrombocytopenia":"<150,000 per mcL",
                "thrombocytosis": ">400,000 per mcL",
                "unit":           "per mcL",
            },
        }

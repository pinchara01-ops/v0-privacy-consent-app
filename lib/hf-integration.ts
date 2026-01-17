
import { type BotDetectionEvent } from "./types"

const HF_SPACE_URL = "https://aadhya-r-bot-detection.hf.space/api/predict";

export interface HFForensicPayload {
    mouse_trace: Array<{ x: number, y: number, t: number }>;
    network_timestamps: number[];
    botd_score: number;
}

export interface HFModelResponse {
    is_bot: boolean;
    confidence: number;
    label: string;
}

/**
 * Connects to the Hugging Face Space 'Aadhya-R/Bot-Detection'
 * Sends raw forensic data and retrieves the model's prediction.
 */
export async function analyzeWithHuggingFace(payload: HFForensicPayload): Promise<HFModelResponse | null> {
    console.log("🚀 Sending forensics to Hugging Face Model:", payload.mouse_trace.length, "points");

    try {
        // We assume the Gradio app expects a JSON input matching the structure we defined
        const response = await fetch(HF_SPACE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data: [
                    JSON.stringify(payload) // Gradio often expects the input as a stringified JSON inside an array
                ]
            }),
        });

        if (!response.ok) {
            console.error(`❌ HF Model Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
            return null;
        }

        const result = await response.json();
        console.log("✅ HF Model Response:", result);

        // Parse Gradio output (usually { data: [ "Label", confidence_score ] } or similar)
        // Adjust this parsing logic based on your specific model's return signature
        if (result.data) {
            // Example: Model returns [ "Bot", 0.98 ]
            const label = result.data[0];
            const confidence = typeof result.data[1] === 'number' ? result.data[1] : 0;

            return {
                is_bot: label.toString().toLowerCase().includes("bot"),
                label: label.toString(),
                confidence: confidence
            };
        }

        return null;

    } catch (error) {
        console.error("⚠️ Failed to connect to Hugging Face Space:", error);
        return null;
    }
}

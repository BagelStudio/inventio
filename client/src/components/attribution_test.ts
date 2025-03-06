import ollama from "ollama";
import fs from "fs";
import sharp from "sharp";

// interface Payload {
//     model: string,
//     prompt: string,
//     system: string,
//     images: string[]
//     format: string
// }

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

async function resizeImage(imagePath: string): Promise<string> {
    const buffer = await sharp(imagePath).resize(512, 512).toBuffer();
    return buffer.toString("base64");
}

async function imageToUint8Array(imagePath: string): Promise<Uint8Array> {
    const buffer = fs.readFileSync(imagePath);
    return new Uint8Array(buffer);
}

// Example usage

const image_path = '../uploads/91897ec6c45800ec387798100.jpg';

const imageData = await imageToUint8Array(image_path);

// const base64Image = imageData;

const base64Image = await resizeImage(image_path);
// const base64Image = `${fs.readFileSync(`${image_path}`, { encoding: "base64" })}`;


const payload = {
    model: 'llama3.2-vision',
    prompt: 'Here is the image you need to create attributes for:',
    system: `You are an expert at image classification and attribution.
            Your job is to analyse images of lost items and create a json of attributes
            that effectively describe the unique features of that item.
            Use attributes that would be commonly used to identify lost items such as item type, color, brand, etc.`,
    images: [base64Image],
    format: 'json'
}

const response = await ollama.generate(payload);

console.log(response)
console.log(response.response)
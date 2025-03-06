import ollama from "ollama";

interface Payload {
    model: string,
    prompt: string,
    system: string,
    images: string[]
    format: string
}

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        }
        reader.onerror = error => reject(error);
    });
};

// async function resizeImage(imagePath: string): Promise<string> {
//     const buffer = await sharp(imagePath).resize(512, 512).toBuffer();
//     return buffer.toString("base64");
// };

// async function imageToUint8Array(imagePath: string): Promise<Uint8Array> {
//     const buffer = fs.readFileSync(imagePath);
//     return new Uint8Array(buffer);
// };

export async function generateAttributes(image: File, model: string): Promise<string | undefined> {
    const imageData = await fileToBase64(image);
    const payload : Payload= {
        model: model,
        prompt: 'Here is the image you need to create attributes for:',
        system: `You are an expert at image classification and attribution.
                Your job is to analyse images of lost items and create a json of attributes
                that effectively describe the unique features of that item.
                Use attributes that would be commonly used to identify lost items such as item type, color, etc.`,
        images: [imageData],
        format: 'json'
    };
    
    try {
        const response = await ollama.generate(payload);
        console.log((response.total_duration/1000000000).toFixed(2));
        return response.response
    } catch (error) {
        console.error('Error generating attributes', error); 
    }

};


// const image_path = '../uploads/91897ec6c45800ec387798100.jpg';

// const imageData = await imageToUint8Array(image_path);

// // const base64Image = imageData;

// const base64Image = await resizeImage(image_path);
// // const base64Image = `${fs.readFileSync(`${image_path}`, { encoding: "base64" })}`;


// const payload = {
//     model: 'llama3.2-vision',
//     prompt: 'Here is the image you need to create attributes for:',
//     system: `You are an expert at image classification and attribution.
//             Your job is to analyse images of lost items and create a json of attributes
//             that effectively describe the unique features of that item.
//             Use attributes that would be commonly used to identify lost items such as item type, color, brand, etc.`,
//     images: [base64Image],
//     format: 'json'
// }

// const response = await ollama.generate(payload);

// console.log(response)
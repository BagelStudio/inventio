import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import './App.css';
import Results from './results.tsx';
import { generateAttributes } from './components/attribution.ts';


interface FoundItem {
    id: number;
    type: string;
    description: string;
    imagePath: string | null;
}

function App() {
    const [description, setDescription] = useState<string>('');
    const [image, setImage] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [results, setResults] = useState<FoundItem[]>([]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setImage(e.target.files[0]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('description', description);
        if (image) {
            formData.append('image', image);
            const imageAttributes : string = await generateAttributes(image, 'llama3.2-vision');
            formData.append('attributes', imageAttributes);
        }

        try {
            console.log("Db request sent.")
            const response = await axios.post('/lost', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert(response.data.message);
            setDescription('');
            setImage(null);
        } catch (error) {
            console.error('Error submitting item:', error);
        }
    };

    const handleSearch = async () => {
        try {
            const response = await axios.get('/search', {
                params: { description: searchQuery },
            });
            setResults(response.data);
        } catch (error) {
            console.error('Error searching:', error);
        }
    };



    return (
        <div className="app">
            <h1>Lost and Found</h1>

            <form onSubmit={handleSubmit}>
                <label>
                    Description:
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    Image:
                    <input type="file" accept="image/*" onChange={handleImageChange} required/>
                </label>
                <br />
                <button type="submit">Submit Lost Item</button>
            </form>

            <h2>Search for Found Items</h2>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description"
            />
            <button onClick={handleSearch}>Search</button>

            <Results />
            <div>
                {results.map((item) => (
                    <div key={item.id}>
                        <p>{item.description}</p>
                        {item.imagePath && (
                            <img src={item.imagePath} alt="Found item" width="100" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
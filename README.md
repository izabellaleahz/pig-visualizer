# Pig vs Human Tile Comparison Visualizer

Interactive web application for visualizing and comparing protein tiles between pig and human proteomes.

## Features

- Interactive tile visualization
- Species comparison (pig vs human)
- Protein detail views
- Search functionality
- Statistics dashboard

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Data

The visualizer uses real pig vs human tiling data from the PhIP-seq pipeline:
- **2,089,836 unique tiles** (756K pig-only, 1.16M human-only, 170K shared)
- **200,282 proteins** (63,561 pig, 136,721 human)

Large data files (>100MB) are stored using Git LFS. To regenerate the data files from source:

```bash
python3 transform_data.py
```

This reads from `../jim/output_array/all_tiles.json` and generates the JSON files in `public/data/`.

## Deployment

This project is configured for Vercel deployment. Simply connect your GitHub repository to Vercel and it will automatically detect the Vite configuration and deploy.

### Vercel Configuration

The project uses Vite's default build output (`dist/`), which Vercel will automatically detect. No additional configuration is required.

**Note:** The data files are large (~1.2GB total). Vercel will serve them, but initial load times may be slower. Consider implementing pagination or lazy loading for production use.

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── public/
│   └── data/           # JSON data files
└── dist/               # Build output (generated)
```

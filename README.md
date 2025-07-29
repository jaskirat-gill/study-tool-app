# Study Tool - AI-Powered Flashcards

A modern Next.js application that transforms your documents into interactive flashcards and practice exams using AI.

## Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **AI-Powered Generation**: Uses Gemini CLI to create flashcards and practice questions
- **Interactive Study Mode**: Quizlet-style flashcard interface
- **Practice Exams**: Multiple-choice questions generated from your content
- **Study Progress Tracking**: Track your performance and accuracy
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **AI Integration**: Google Gemini API
- **Storage**: Local Storage / IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd study-tool-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload a Document**: Go to the Upload page and select a PDF, DOCX, or TXT file
2. **Generate Flashcards**: The AI will analyze your document and create flashcards
3. **Study**: Use the interactive flashcard interface to study your material
4. **Take Practice Exams**: Generate and take multiple-choice practice exams
5. **Track Progress**: Monitor your accuracy and study statistics

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── upload/            # Document upload page
│   ├── study-sets/        # Study sets management
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                  # Utility functions
│   ├── document-processor.ts  # File processing
│   ├── gemini-client.ts      # AI integration
│   ├── storage.ts            # Local storage management
│   └── utils.ts              # General utilities
└── types/                # TypeScript type definitions
```

## AI Integration

The application uses the Google Gemini API for AI-powered content generation:

- **Flashcard Generation**: Extracts key concepts and creates Q&A pairs
- **Practice Exam Creation**: Generates multiple-choice questions
- **Content Analysis**: Identifies important topics and themes

### Setting up Gemini API

1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Copy `.env.example` to `.env.local`
3. Replace `your_gemini_api_key_here` with your actual API key
4. The application will automatically use the API key from environment variables

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Cloud storage integration
- [ ] User authentication
- [ ] Advanced study algorithms (spaced repetition)
- [ ] Study statistics and analytics
- [ ] Collaborative study sets
- [ ] Mobile app version

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

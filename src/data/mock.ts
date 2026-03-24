import { Concept, Project, Skill, Post, Publication } from "@/types";

export const mockConcepts: Concept[] = [
  {
    id: "1",
    name: "Neural Networks",
    short_summary: "Computational models inspired by biological neural networks that learn patterns from data.",
    long_summary: "Neural networks are a class of machine learning algorithms modeled after the human brain. They consist of interconnected nodes (neurons) organized in layers that process information using connectionist approaches. Through training on data, they adjust connection weights to minimize prediction errors, enabling tasks like image recognition, language processing, and decision making.",
    x: -2.1, y: 1.5, z: 0.8,
    date_learned: "2024-01-15",
  },
  {
    id: "2",
    name: "Transformer Architecture",
    short_summary: "Self-attention based architecture that revolutionized NLP and beyond.",
    long_summary: "The Transformer architecture, introduced in 'Attention Is All You Need' (2017), uses self-attention mechanisms to process sequences in parallel rather than sequentially. It consists of encoder and decoder stacks with multi-head attention, enabling models like GPT, BERT, and Claude to understand and generate human language with unprecedented quality.",
    x: -1.8, y: 1.2, z: 1.1,
    date_learned: "2024-02-20",
  },
  {
    id: "3",
    name: "React Hooks",
    short_summary: "Functions that let you use state and lifecycle features in functional components.",
    long_summary: "React Hooks, introduced in React 16.8, allow functional components to manage state (useState), side effects (useEffect), context (useContext), and more without writing class components. Custom hooks enable reusable stateful logic extraction, leading to cleaner, more composable React code.",
    x: 2.5, y: -0.5, z: -1.2,
    date_learned: "2024-03-10",
  },
  {
    id: "4",
    name: "WebGL Rendering",
    short_summary: "Low-level graphics API for rendering 2D and 3D graphics in web browsers.",
    long_summary: "WebGL (Web Graphics Library) is a JavaScript API for rendering high-performance 2D and 3D graphics within web browsers without plugins. It's based on OpenGL ES and provides direct GPU access, enabling complex visualizations, games, and interactive experiences on the web. Three.js and other libraries abstract its complexity.",
    x: 3.0, y: 0.2, z: -0.8,
    date_learned: "2024-03-25",
  },
  {
    id: "5",
    name: "Dimensionality Reduction",
    short_summary: "Techniques for reducing high-dimensional data to fewer dimensions while preserving structure.",
    long_summary: "Dimensionality reduction encompasses techniques like PCA, t-SNE, and UMAP that project high-dimensional data into lower dimensions for visualization and analysis. These methods preserve important structural relationships—distances, clusters, or manifold geometry—making complex datasets interpretable while reducing computational requirements.",
    x: -1.5, y: 2.0, z: -0.3,
    date_learned: "2024-04-05",
  },
  {
    id: "6",
    name: "TypeScript Generics",
    short_summary: "Type variables that enable creating reusable, type-safe components and functions.",
    long_summary: "TypeScript generics allow developers to write functions, classes, and interfaces that work with multiple types while maintaining type safety. Using type parameters like <T>, you can create flexible, reusable code that adapts to different data types at compile time, reducing duplication and catching errors early.",
    x: 2.8, y: -0.8, z: -1.5,
    date_learned: "2024-04-18",
  },
  {
    id: "7",
    name: "Embedding Spaces",
    short_summary: "Dense vector representations where semantic similarity maps to geometric proximity.",
    long_summary: "Embedding spaces are learned vector representations where items (words, images, concepts) are mapped to dense numerical vectors. Semantically similar items end up close together in this space. This enables similarity search, clustering, and analogical reasoning. Models like Word2Vec, BERT, and CLIP create powerful embedding spaces used across ML applications.",
    x: -2.5, y: 1.8, z: 0.2,
    date_learned: "2024-05-02",
  },
  {
    id: "8",
    name: "Supabase Auth",
    short_summary: "Open-source authentication system with row-level security and social login support.",
    long_summary: "Supabase Auth provides a complete authentication system built on top of PostgreSQL. It supports email/password, magic links, social OAuth providers, and phone authentication. Combined with Row Level Security (RLS) policies, it enables fine-grained access control directly at the database level.",
    x: 1.5, y: -2.0, z: 0.5,
    date_learned: "2024-05-20",
  },
  {
    id: "9",
    name: "Framer Motion",
    short_summary: "Production-ready motion library for React with declarative animations.",
    long_summary: "Framer Motion is a React animation library that provides a declarative API for creating fluid animations and gestures. It supports layout animations, shared layout transitions, scroll-based animations, and physics-based spring animations. Its motion components make complex animations accessible through simple props.",
    x: 2.2, y: 0.5, z: -0.5,
    date_learned: "2024-06-08",
  },
  {
    id: "10",
    name: "Attention Mechanisms",
    short_summary: "Neural network components that learn to focus on relevant parts of input data.",
    long_summary: "Attention mechanisms allow neural networks to dynamically focus on different parts of input when producing output. Self-attention computes relationships between all positions in a sequence, while cross-attention relates two different sequences. These mechanisms are foundational to transformers and have dramatically improved performance across NLP, vision, and multimodal tasks.",
    x: -2.3, y: 1.0, z: 1.3,
    date_learned: "2024-06-25",
  },
  {
    id: "11",
    name: "Next.js App Router",
    short_summary: "File-based routing system with React Server Components and nested layouts.",
    long_summary: "Next.js App Router is a modern routing paradigm that leverages React Server Components by default. It uses a file-system based router with folders defining routes, and special files (layout.tsx, page.tsx, loading.tsx) for UI organization. It supports nested layouts, streaming, and server actions for a full-stack React experience.",
    x: 2.0, y: -1.2, z: -0.9,
    date_learned: "2024-07-12",
  },
  {
    id: "12",
    name: "Reinforcement Learning",
    short_summary: "Learning paradigm where agents learn optimal behavior through trial, error, and rewards.",
    long_summary: "Reinforcement Learning (RL) trains agents to make sequential decisions by maximizing cumulative rewards. Through exploration and exploitation, agents learn policies mapping states to actions. Key concepts include value functions, policy gradients, and temporal difference learning. RL powers game-playing AIs, robotics, and recommendation systems.",
    x: -3.0, y: 0.5, z: 0.0,
    date_learned: "2024-08-01",
  },
  {
    id: "13",
    name: "Three.js Scene Graph",
    short_summary: "Hierarchical structure organizing 3D objects, lights, and cameras for rendering.",
    long_summary: "The Three.js scene graph is a tree structure where the Scene object is the root, containing meshes, lights, cameras, and groups as children. Each object has position, rotation, and scale relative to its parent. This hierarchy enables complex 3D compositions, transformations, and efficient rendering through frustum culling and level-of-detail management.",
    x: 3.2, y: 0.8, z: -0.3,
    date_learned: "2024-08-20",
  },
  {
    id: "14",
    name: "Vector Databases",
    short_summary: "Databases optimized for storing and querying high-dimensional vector embeddings.",
    long_summary: "Vector databases are specialized systems designed to store, index, and search high-dimensional vector embeddings efficiently. Using algorithms like HNSW, IVF, and product quantization, they enable fast approximate nearest neighbor searches. Tools like Pinecone, Weaviate, and pgvector power semantic search, recommendation engines, and RAG applications.",
    x: -1.0, y: 2.5, z: -0.8,
    date_learned: "2024-09-05",
  },
  {
    id: "15",
    name: "CSS Container Queries",
    short_summary: "Style elements based on their container size rather than viewport size.",
    long_summary: "CSS Container Queries allow components to adapt their styling based on the size of their containing element rather than the viewport. This enables truly modular, responsive components that work correctly regardless of where they're placed in a layout. Combined with container query units (cqw, cqh), they represent a paradigm shift in responsive design.",
    x: 1.8, y: -1.8, z: -1.0,
    date_learned: "2024-09-22",
  },
];

export const mockProjects: Project[] = [
  {
    id: "agentic-bi",
    title: "Agentic BI Decision Engine",
    description: "Designing an agentic BI decision engine at Globalink AI combining ML models, LLMs, and Knowledge Graphs to generate actionable e-commerce merchant recommendations across growth, margin optimization, and inventory risk.",
    tech: ["Git", "Python", "LLM", "Knowledge Graphs", "Machine Learning", "Deep Learning", "NLP"],
    content: `## Overview

Building an agentic business intelligence system at Globalink AI that reasons across competing merchant objectives — growth vs. margin optimization vs. inventory risk — to produce actionable recommendations for e-commerce merchants.

## Architecture

The system combines three core components:

- **ML Models** — Predictive models for demand forecasting, price elasticity, and inventory depletion
- **Knowledge Graphs** — Constraint modeling that encodes business rules, product relationships, and market dynamics
- **LLM Reasoning** — Large language model layer that synthesizes model outputs with KG constraints to generate explainable decisions

## Key Challenges

1. **Multi-objective optimization** — Balancing growth, margin, and risk requires Pareto-optimal reasoning rather than single-metric optimization
2. **Explainability** — Every recommendation must trace back to specific data points and constraints
3. **Cold-start merchants** — Few-shot learning and Bayesian updating for reliable decisions from limited operational data

## Evaluation Framework

Measuring decision quality through:
- Merchant outcome metrics (revenue lift, margin improvement)
- A/B-tested recommendation lift against baseline strategies
- Consistency audits ensuring recommendations don't contradict across related SKUs`,
  },
  {
    id: "sublora-bounds",
    title: "Extending Non-Vacuous Generalization Bounds for LLMs",
    description: "Extended SubLoRA framework for PAC-Bayes generalization bounds on GPT-2 with adaptive per-layer subspace allocation. Resolved 857x performance bottleneck on A100 GPUs via tensor caching.",
    tech: ["Git", "Python", "PyTorch", "Deep Learning", "HPC", "Singularity", "Machine Learning"],
    github: "https://github.com/jiaxuan030331/separated-projectors-sublora-bounds-for-llms",
    content: `## Overview

Extended the SubLoRA framework to achieve non-vacuous PAC-Bayes generalization bounds on GPT-2, developing adaptive per-layer subspace allocation that better captures the varying complexity across transformer layers.

## The Performance Bottleneck

The original implementation had a critical bottleneck: projection matrices were being recomputed on every forward pass across all projection classes. This resulted in training times of ~7 days per experiment on A100 GPUs.

**Solution:** Implemented tensor caching across projection classes, reducing per-experiment added training time from ~7 days to ~12 minutes — an **857x speedup**.

## Adaptive Per-Layer Allocation

Standard SubLoRA uses uniform subspace dimensions across all layers. Our key insight: different layers in a transformer capture different levels of abstraction and should have proportionally different subspace sizes.

We developed an allocation strategy that:
- Assigns larger subspaces to attention layers (which capture complex token relationships)
- Uses smaller subspaces for feed-forward layers (which perform simpler transformations)
- Dynamically adjusts based on per-layer gradient statistics during early training

## Results

Achieved competitive non-vacuous generalization bounds on OpenWebText, demonstrating that large language models can provably generalize rather than merely memorize their training data.

## Infrastructure

All experiments ran on NYU HPC (SLURM) with A100 GPUs, using a custom training/evaluation pipeline with automated hyperparameter sweeps.`,
  },
  {
    id: "curiosity",
    title: "Curiosity – AI Chat Platform",
    description: "Full-stack AI chat app with conversation branching, dialogue tree visualization, multi-provider LLM support (OpenAI, Anthropic, Gemini, Ollama), OAuth, and vector-embedding memory for RAG context.",
    tech: ["Git", "TypeScript", "JavaScript", "Next.js", "React", "Supabase", "Vercel", "RAG", "NLP", "Tailwind CSS"],
    link: "https://curiositylm.app",
    github: "https://github.com/sunnydigital/curiosity",
    content: `## Overview

Curiosity is a full-stack AI chat application that reimagines how we interact with language models. Instead of linear conversations, users can branch, explore, and navigate nonlinear dialogue paths.

## Key Features

### Conversation Branching
Users can highlight any passage in a conversation to spawn a contextual branch — exploring tangential topics without losing their place in the main thread. Each branch inherits context from its parent.

### Dialogue Tree Visualization
An interactive tree visualization lets users see the full structure of their conversation, navigate between branches, and understand the relationships between different discussion threads.

### Multi-Provider LLM Support
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude)
- **Google** (Gemini)
- **Local** (Ollama for privacy-first usage)

### Vector-Embedding Memory
A persistent RAG system using vector embeddings that gives the AI long-term memory across conversations, enabling it to reference past discussions and maintain context over time.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Deployment:** Vercel
- **Auth:** OAuth integration with multiple providers`,
  },
  {
    id: "enterprise-rag",
    title: "Enterprise RAG LLM System",
    description: "Engineered an enterprise-scale RAG system at Amazon serving 15,000 tables across 200 schemas with automated DDL generation, git-style versioning, and Slack notifications using AWS S3, Bedrock, and Redshift.",
    tech: ["Git", "Python", "AWS Bedrock", "Redshift", "S3", "RAG", "SQL", "Slack API"],
    content: `## Overview

Built an enterprise-scale Retrieval-Augmented Generation system at Amazon that serves 15,000 tables across 200 schemas, dramatically reducing the time engineers spend discovering and understanding data assets.

## The Problem

Data engineers spent hours manually searching through thousands of database tables to find relevant data for their queries. Schema documentation was sparse, outdated, or nonexistent.

## Solution

### Automated DDL Generation
Built a pipeline that automatically generates human-readable descriptions for every table and column, using LLMs to infer semantics from column names, data samples, and usage patterns.

### Intelligent Retrieval
Combined dense embeddings with sparse BM25 search for hybrid retrieval that handles both semantic queries ("find tables about customer transactions") and exact matches ("CUST_TXN_HIST table").

### Git-Style Versioning
Implemented md5 hash-based difference tracking for schema changes, enabling:
- Rollback to any previous schema state
- Diff views showing what changed between versions
- Reduced schema conflicts by 60%

### Real-Time Monitoring
Slack API integration providing automated notifications on daily table schema modifications, cutting manual monitoring overhead by 90%.

## Impact

- **75% reduction** in data discovery time
- **60% fewer** schema conflicts
- **90% less** manual monitoring overhead`,
  },
  {
    id: "ddpm-histopath",
    title: "DDPM for Histopathologic Images",
    description: "Built denoising diffusion probabilistic models for histopathologic cancer detection on the Patch Camelyon dataset with comprehensive ablation studies.",
    tech: ["Git", "Python", "PyTorch", "Diffusion Models", "Computer Vision", "Deep Learning"],
    github: "https://github.com/sunnydigital/ddpm-histo-gen",
    content: `## Overview

Applied Denoising Diffusion Probabilistic Models (DDPMs) to histopathologic cancer detection using the Patch Camelyon (PCam) dataset containing 327,680 image patches.

## Architecture

- **Backbone:** U-Net with residual blocks and group normalization
- **Attention:** Self-attention at 16x16 and 8x8 resolutions
- **Time Embedding:** Sinusoidal positional encoding
- **Noise Schedule:** Linear (β₁ = 1e-4, βT = 0.02)

## Ablation Studies

Conducted comprehensive ablations revealing:
1. **Noise schedule** had the largest impact on sample quality
2. **Attention layers** were second most impactful
3. **Model depth** beyond 4 blocks showed diminishing returns
4. **Lower learning rates** (1e-5) outperformed typical 2e-4
5. **Color augmentation hurt** — stain colors carry diagnostic meaning in medical images

## Key Finding

Diffusion-pretrained features transferred beautifully to classification, improving cancer detection accuracy by 3.2% over training from scratch.`,
  },
  {
    id: "medical-imaging",
    title: "Medical Imaging Pipeline (NYU Langone)",
    description: "End-to-end ML pipeline for biomedical data with U-Net CNN architectures, transfer learning, and pathway analysis for cardiovascular research. Reduced processing from 8 hours to 45 minutes.",
    tech: ["Git", "Python", "PyTorch", "Keras", "NumPy", "Pandas", "SciPy", "Computer Vision", "Deep Learning", "R", "Scikit-Learn", "OpenCV"],
    content: `## Overview

Developed a comprehensive machine learning pipeline at NYU Langone Health for biomedical data analysis, supporting cardiovascular research through computer vision and bioinformatics approaches.

## Computer Vision Component

Implemented U-Net convolutional neural network architectures with transfer learning for medical image segmentation:
- Analyzed over 2,000 microscopy samples
- Achieved 15% improvement in segmentation accuracy
- Applied data augmentation techniques tailored for medical imaging

## Data Pipeline Optimization

Designed the end-to-end preprocessing pipeline that:
- Reduced processing time from **8 hours to 45 minutes**
- Maintained over 90% data quality
- Used feature engineering and domain-specific augmentation

## Pathway Analysis

Identified key biological pathways involved in:
- Glucose uptake and transport
- Lipid uptake and oxidation
- Targeted therapeutic interventions for cardiovascular conditions

## Bioinformatics

- Composed 2,000+ lines of R code for comprehensive analysis
- Processed datasets with over 300,000 records
- Implemented dimensionality reduction (UMAP, t-SNE) for immune cell clustering
- Applied trajectory inference modeling for CXCL12/CXCR4/ACKR3 receptor interactions and CD8+ T Cell dynamics`,
  },
  {
    id: "web-summarizer",
    title: "ChatGPT Web Summarizer Plugin",
    description: "A ChatGPT companion plugin that parses URL content (HTML/PDF) for conversational agents, enabling real-time webpage summarization and information extraction.",
    tech: ["Git", "Python", "ChatGPT Plugins", "HTML Parsing", "NLP"],
    github: "https://github.com/sunnydigital/web-sum",
    content: `## Overview

A ChatGPT companion plugin that enables real-time webpage summarization by parsing URL content (HTML and PDF) and feeding it to conversational agents for intelligent information extraction.

## How It Works

1. User provides a URL to the ChatGPT plugin
2. The plugin fetches and parses the page content (supports both HTML and PDF)
3. Content is cleaned, structured, and sent to the LLM
4. ChatGPT can then answer questions about, summarize, or analyze the content

## Technical Details

- **HTML Parsing** — Extracts main content while filtering navigation, ads, and boilerplate
- **PDF Extraction** — Handles multi-page documents with proper text ordering
- **Content Chunking** — Intelligently splits large documents to fit within context windows
- **Plugin API** — Follows the OpenAI ChatGPT Plugin specification for seamless integration`,
  },
  {
    id: "datathon-winner",
    title: "NYU DSC x Peak AI Datathon — Winner",
    description: "Built a winning recommender system using k-NN with GloVe-50d embeddings, competing against 50+ teams in the NYU Data Science Club x Peak.AI datathon.",
    tech: ["Git", "Python", "NumPy", "Pandas", "SciPy", "k-NN", "GloVe", "Recommender Systems", "Scikit-Learn"],
    github: "https://github.com/sunnydigital/datathon-f22",
    content: `## Overview

Won first place in the NYU Data Science Club x Peak.AI datathon (Fall 2022), competing against 50+ teams to build the best recommender system.

## Approach

Used k-Nearest Neighbors with GloVe-50d word embeddings to build a content-based recommendation engine that could match users with relevant items based on semantic similarity.

## Why GloVe + k-NN?

- **GloVe embeddings** capture semantic relationships between words in a dense 50-dimensional space
- **k-NN** provides interpretable, tunable recommendations with clear similarity scores
- The combination offered a strong balance of accuracy and explainability — key for the judging criteria

## Results

The approach outperformed more complex models (neural collaborative filtering, matrix factorization) submitted by other teams, demonstrating that well-chosen simple methods with strong feature engineering can beat complex architectures.`,
  },
  {
    id: "stock-forecasting",
    title: "NeuralProphet Stock Forecasting",
    description: "Stock price forecasting using NeuralProphet time-series decomposition with AR-Net and additive events for IT sector stocks.",
    tech: ["Git", "Python", "NumPy", "Pandas", "SciPy", "NeuralProphet", "Time Series", "PyTorch"],
    github: "https://www.github.com/sunnydigital/ptsa-f22",
    content: `## Overview

Built a stock price forecasting system for IT sector stocks using NeuralProphet, which combines the decomposability of Prophet with the power of neural networks.

## Method

NeuralProphet decomposes time series into:
- **Trend** — Long-term directional movement
- **Seasonality** — Recurring patterns (weekly, monthly, quarterly)
- **AR-Net** — Auto-regressive neural network component for capturing complex temporal dependencies
- **Additive Events** — Incorporating external events (earnings reports, market events) as features

## Key Insights

- AR-Net significantly improved short-term prediction accuracy over vanilla Prophet
- Event features for earnings dates and market-moving announcements added meaningful signal
- Ensemble of per-stock models outperformed a single cross-stock model`,
  },
  {
    id: "esg-nlp",
    title: "ESG NLP Classification",
    description: "Fine-tuned language models on Reddit ESG data with SHAP feature attribution for interpretable ESG scoring and analysis.",
    tech: ["Git", "Python", "NumPy", "Pandas", "SciPy", "NLP", "SHAP", "Hugging Face Transformers", "Scikit-Learn"],
    github: "https://github.com/sunnydigital/nlp-f22",
    content: `## Overview

Fine-tuned language models to classify Environmental, Social, and Governance (ESG) sentiment from Reddit discussions, with SHAP-based feature attribution for interpretable scoring.

## Data

Collected and processed Reddit posts and comments related to ESG topics, creating a labeled dataset for multi-class classification across E, S, and G categories.

## Model

- **Base Model:** Pre-trained transformer (Hugging Face)
- **Fine-tuning:** Domain-adapted on ESG Reddit corpus
- **Interpretability:** SHAP (SHapley Additive exPlanations) values for every prediction

## Why SHAP?

ESG scoring needs to be explainable — investors and analysts need to understand *why* a company scores a certain way. SHAP provides:
- Per-feature importance for each prediction
- Visual explanations showing which words/phrases drove the classification
- Consistency and additivity properties that make explanations trustworthy`,
  },
  {
    id: "persona-emulation",
    title: "Persona Emulation & Dialogue",
    description: "Fine-tuning GPT-3 on movie, book, and game dialogue (LotR, Harry Potter, FF XIV) to generate character-specific responses.",
    tech: ["Git", "Python", "NumPy", "Pandas", "SciPy", "GPT-3", "Fine-tuning", "NLP"],
    content: `## Overview

Fine-tuned GPT-3 on dialogue from iconic fictional universes to generate character-specific responses that capture the voice, mannerisms, and knowledge of individual characters.

## Characters & Sources

- **Lord of the Rings** — Gandalf, Aragorn, Frodo
- **Harry Potter** — Dumbledore, Snape, Hermione
- **Final Fantasy XIV** — Various NPCs and story characters

## Approach

1. **Data Collection** — Extracted dialogue scripts and organized by character
2. **Prompt Engineering** — Designed templates that set character context and voice
3. **Fine-tuning** — Trained separate LoRA adapters per character on GPT-3
4. **Evaluation** — Human evaluation for voice consistency, knowledge accuracy, and engagement

## Fun Results

The models captured subtle character traits — Gandalf's tendency to speak in riddles, Snape's sarcasm, Hermione's precision. The FF XIV characters were particularly interesting as they blend formal fantasy language with game-specific terminology.`,
  },
  {
    id: "cover-gen",
    title: "Cover Letter Generator",
    description: "A Python CLI tool that generates tailored cover letters using AI, streamlining the job application process.",
    tech: ["Git", "Python", "CLI", "NLP", "OpenAI"],
    github: "https://github.com/sunnydigital/cover-gen",
    content: `## Overview

A command-line tool that generates personalized cover letters by combining your resume with job descriptions, using OpenAI's API to produce tailored, professional letters.

## Usage

\`\`\`bash
cover-gen --resume resume.pdf --job "https://job-posting-url.com"
\`\`\`

## Features

- **PDF Resume Parsing** — Automatically extracts your experience and skills
- **Job Description Analysis** — Identifies key requirements and keywords
- **Intelligent Matching** — Highlights relevant experience for each specific role
- **Multiple Tones** — Professional, conversational, or enthusiastic
- **Batch Mode** — Generate letters for multiple job postings at once

## Why CLI?

A CLI tool fits naturally into a job search workflow — scriptable, fast, and can be combined with other tools. No web UI overhead, just results.`,
  },
  {
    id: "galaxy-portfolio",
    title: "3D Galaxy Portfolio",
    description: "This portfolio site — interactive 3D galaxy visualization with Three.js, scroll-driven mode transitions, UMAP clustering, and concept management.",
    tech: ["Git", "TypeScript", "JavaScript", "Next.js", "React", "Three.js", "Tailwind CSS", "Vercel", "WebGL"],
    link: "https://www.sunnyson.dev",
    content: `## Overview

This very website — an interactive 3D galaxy visualization where each star represents a concept I've learned, with scroll-driven transitions between three viewing modes.

## Visualization Modes

- **Galaxy** — Procedural spiral galaxy (7000 stars) using the pickles976 algorithm with bloom post-processing
- **Clusters** — UMAP dimensionality reduction groups concepts by semantic similarity using client-side embeddings
- **Timeline** — Chronological sin(x) wave arrangement of concepts

## Technical Highlights

- **Procedural Galaxy** — Gaussian random + spiral function, core/outer-core/2-arm structure
- **Client-Side Embeddings** — Hugging Face Transformers (all-MiniLM-L6-v2, 384-dim) running in the browser
- **Deterministic UMAP** — Seeded PRNG ensures consistent cluster positions across page loads
- **Scroll Trap** — Wheel events intercepted to switch visualization modes before allowing page scroll
- **KaTeX** — LaTeX rendering throughout the site for mathematical content
- **Google OAuth** — Restricted login for content management

## Stack

Next.js, React Three Fiber, Three.js, Framer Motion, NextAuth, Vercel, Tailwind CSS`,
  },
];

export const mockSkills: Skill[] = [
  // Programming Languages
  { name: "Python", level: 95, category: "Programming Languages" },
  { name: "R", level: 80, category: "Programming Languages" },
  { name: "Java", level: 70, category: "Programming Languages" },
  { name: "SQL", level: 85, category: "Programming Languages", tags: ["Supabase", "Redshift", "S3"] },
  { name: "JavaScript", level: 78, category: "Programming Languages" },
  { name: "TypeScript", level: 78, category: "Programming Languages" },
  { name: "HTML", level: 75, category: "Programming Languages", tags: ["HTML Parsing"] },
  { name: "CSS", level: 75, category: "Programming Languages", tags: ["Tailwind CSS"] },
  { name: "Bash", level: 70, category: "Programming Languages" },
  // AI / ML Frameworks
  { name: "PyTorch", level: 90, category: "AI / ML Frameworks", tags: ["NeuralProphet"] },
  { name: "Keras", level: 85, category: "AI / ML Frameworks" },
  { name: "Scikit-Learn", level: 92, category: "AI / ML Frameworks" },
  { name: "XGBoost", level: 85, category: "AI / ML Frameworks" },
  { name: "Hugging Face Transformers", level: 88, category: "AI / ML Frameworks", tags: ["Transformers"] },
  { name: "spaCy", level: 80, category: "AI / ML Frameworks" },
  { name: "OpenCV", level: 78, category: "AI / ML Frameworks" },
  { name: "LoRA", level: 75, category: "AI / ML Frameworks", tags: ["Fine-tuning"] },
  { name: "Ollama", level: 72, category: "AI / ML Frameworks" },
  // Data & Compute
  { name: "NumPy", level: 95, category: "Data & Compute" },
  { name: "Pandas", level: 95, category: "Data & Compute" },
  { name: "SciPy", level: 90, category: "Data & Compute" },
  { name: "W&B", level: 80, category: "Data & Compute", tags: ["Weights & Biases", "Weights and Biases", "WandB"] },
  { name: "MLflow", level: 75, category: "Data & Compute" },
  { name: "Apache Airflow", level: 75, category: "Data & Compute" },
  { name: "Raytune", level: 70, category: "Data & Compute" },
  // Cloud & Infrastructure
  { name: "AWS S3", level: 82, category: "Cloud & Infrastructure", tags: ["S3"] },
  { name: "AWS Bedrock", level: 80, category: "Cloud & Infrastructure", tags: ["Bedrock"] },
  { name: "AWS Redshift", level: 78, category: "Cloud & Infrastructure", tags: ["Redshift"] },
  { name: "HPC (SLURM)", level: 78, category: "Cloud & Infrastructure", tags: ["HPC", "SLURM"] },
  { name: "Vercel", level: 80, category: "Cloud & Infrastructure" },
  { name: "Supabase", level: 78, category: "Cloud & Infrastructure" },
  // MLOps & Tools
  { name: "Git", level: 88, category: "MLOps & Tools" },
  { name: "Docker", level: 75, category: "MLOps & Tools" },
  { name: "Singularity", level: 70, category: "MLOps & Tools" },
  { name: "Next.js", level: 82, category: "MLOps & Tools" },
  { name: "React", level: 80, category: "MLOps & Tools" },
  { name: "Three.js", level: 75, category: "MLOps & Tools", tags: ["WebGL"] },
  { name: "Tailwind CSS", level: 80, category: "MLOps & Tools" },
  // Specializations
  { name: "NLP", level: 92, category: "Specializations", tags: ["LLM", "RAG", "GPT-3", "ChatGPT Plugins", "OpenAI", "Knowledge Graphs"] },
  { name: "Computer Vision", level: 85, category: "Specializations", tags: ["Diffusion Models"] },
  { name: "Deep Learning", level: 90, category: "Specializations", tags: ["Diffusion Models", "LLM"] },
  { name: "Machine Learning", level: 92, category: "Specializations", tags: ["Recommender Systems", "k-NN", "GloVe", "SHAP"] },
  { name: "Time Series", level: 82, category: "Specializations", tags: ["NeuralProphet"] },
];

export const mockPublications: Publication[] = [
  {
    id: "cardiac-lipid-droplets",
    title: "Cardiac lipid droplets differ under pathological and physiological conditions",
    journal: "Journal of Lipid Research",
    date: "2025",
    url: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=tGaMcikAAAAJ&citation_for_view=tGaMcikAAAAJ:d1gkVwhDpl0C",
    authors: "NH Son, S Son, M Verano, ZX Liu, W Younis, M Komack, KV Ruggles, et al.",
    contribution: "Contributed to data analysis and computational methods for characterizing lipid droplet composition differences between pathological and physiological cardiac conditions.",
  },
  {
    id: "t-cell-egress",
    title: "T cell egress via lymphatic vessels is tuned by antigen encounter and limits tumor control",
    journal: "Nature Immunology",
    date: "2023",
    url: "https://www.nature.com/articles/s41590-023-01443-y",
    authors: "MM Steele, A Jaiswal, I Delclaux, ID Dryg, D Murugan, J Femel, S Son, et al.",
    contribution: "Pipelined and analyzed genomic data, performing dimensionality reduction and subsetting to organize cell populations. Applied various semi-supervised and unsupervised methods to determine the optimal format for inferring the pseudotime trajectory of cell-fate in relation to gene expression.",
  },
];

export const mockPosts: Post[] = [
  {
    id: "rag-at-scale",
    title: "Building RAG Systems at Scale: Lessons from Amazon",
    excerpt: "What I learned engineering an enterprise RAG pipeline serving 15,000 tables — from chunking strategies to hallucination guardrails.",
    content: `# Building RAG Systems at Scale: Lessons from Amazon

Retrieval-Augmented Generation sounds simple in theory: fetch relevant context, feed it to an LLM, get a grounded answer. In practice, scaling this to **15,000 tables across 200 schemas** at Amazon taught me that the devil is in the details.

## The Chunking Problem

The first challenge was figuring out *what* to retrieve. Database schemas aren't documents — they're structured metadata with implicit relationships. We ended up building a custom DDL generator that produced natural-language-friendly descriptions of each table, including column semantics, join paths, and usage patterns.

## Embedding Strategy

We experimented with several embedding models before settling on a hybrid approach: dense embeddings for semantic similarity combined with sparse BM25 for exact keyword matching. This was crucial for handling technical terms and table names that semantic models often mangle.

## Hallucination Guardrails

The biggest risk in enterprise RAG is confident wrong answers. We implemented a multi-layer verification system:

- **Schema validation**: Generated SQL is checked against actual DDL
- **Result sanity checks**: Row counts and value distributions are verified
- **Confidence scoring**: Low-confidence answers are flagged for human review

## Key Takeaways

1. **Chunking strategy matters more than model choice** — garbage in, garbage out
2. **Hybrid retrieval beats pure semantic search** for technical domains
3. **Version your knowledge base** — we used git-style versioning for DDL changes
4. **Monitor everything** — Slack alerts on retrieval failures saved us countless times`,
    date: "2025-01-15",
    tags: ["RAG", "LLM", "AWS", "Enterprise ML"],
  },
  {
    id: "diffusion-histopath",
    title: "Diffusion Models for Medical Imaging: A Practical Guide",
    excerpt: "How we applied DDPMs to histopathologic cancer detection — architecture choices, training tricks, and what the ablation studies revealed.",
    content: `# Diffusion Models for Medical Imaging: A Practical Guide

Denoising Diffusion Probabilistic Models (DDPMs) have taken the generative AI world by storm, but their application to **medical imaging** presents unique challenges and opportunities.

## Why Diffusion for Histopathology?

The Patch Camelyon (PCam) dataset contains 327,680 histopathologic patches — a massive dataset by medical imaging standards, but tiny compared to what models like Stable Diffusion train on. We wanted to explore whether diffusion models could augment limited medical training data.

## Architecture Decisions

We started with a standard U-Net backbone but found that **attention at multiple resolutions** was critical for capturing both cellular-level and tissue-level patterns. Our final architecture used:

- Residual blocks with group normalization
- Self-attention at 16x16 and 8x8 resolutions
- Sinusoidal time embeddings
- Linear noise schedule (β₁ = 1e-4, βT = 0.02)

## Training Insights

Medical images have different statistical properties than natural images. Key findings:

1. **Longer training schedules** — convergence took 2-3x longer than natural image datasets
2. **Lower learning rates** — 1e-5 worked better than the typical 2e-4
3. **Color augmentation hurts** — unlike natural images, stain colors carry diagnostic meaning

## Ablation Results

Our ablation studies revealed that the noise schedule had the largest impact on sample quality, followed by the number of attention layers. Surprisingly, increasing model depth beyond 4 blocks showed diminishing returns.

## The Bigger Picture

Diffusion models aren't just for generation — the learned representations transfer beautifully to classification tasks. Our diffusion-pretrained features improved cancer detection accuracy by 3.2% over training from scratch.`,
    date: "2024-11-20",
    tags: ["Diffusion Models", "Medical Imaging", "PyTorch", "Deep Learning"],
  },
  {
    id: "embeddings-demystified",
    title: "Embedding Spaces Demystified: From Word2Vec to CLIP",
    excerpt: "A visual tour through embedding spaces — what they are, why they work, and how to build intuition for high-dimensional geometry.",
    content: `# Embedding Spaces Demystified: From Word2Vec to CLIP

If there's one concept that underpins modern ML, it's **embeddings**. But what does it actually mean to represent a word, image, or concept as a point in high-dimensional space?

## The Core Idea

An embedding is a learned mapping from discrete objects to continuous vectors. The magic: **semantic relationships become geometric relationships**. Similar things end up close together.

## Word2Vec: Where It Started

Word2Vec (2013) showed that training a simple neural network to predict neighboring words produces vectors where:

\`king - man + woman ≈ queen\`

This wasn't engineered — it *emerged* from the training objective. The geometry of language was hiding in co-occurrence statistics all along.

## From Words to Everything

The embedding paradigm has since expanded to:

- **Sentences** (Sentence-BERT): Encode entire sentences for semantic search
- **Images** (ResNet features, DINO): Visual similarity in vector space
- **Multimodal** (CLIP): Images and text in a *shared* space
- **Code** (CodeBERT): Programming language semantics

## Building Intuition

High-dimensional spaces are weird. Some counterintuitive properties:

1. **Most volume is near the surface** — in high dimensions, almost everything is "far from the center"
2. **Random vectors are nearly orthogonal** — in 768 dimensions, any two random vectors will have cosine similarity near 0
3. **Curse of dimensionality** — distances become less meaningful as dimensions increase, which is why approximate methods (HNSW, IVF) work so well

## Practical Tips

When working with embeddings:

- **Always normalize** before computing cosine similarity
- **Dimensionality reduction** (PCA to ~256) often improves downstream performance
- **Domain-specific fine-tuning** beats larger generic models
- **Monitor embedding drift** in production systems`,
    date: "2024-09-10",
    tags: ["Embeddings", "NLP", "Machine Learning", "Tutorial"],
  },
  {
    id: "ddpm-histo-gen",
    title: "Generating Histopathology: DDPMs on the Patch Camelyon Dataset",
    excerpt: "A deep dive into training unconditional Denoising Diffusion Probabilistic Models on cancerous and non-cancerous tissue patches — architecture, noise schedules, ablation studies, and what the reverse diffusion process actually looks like.",
    content: `# Generating Histopathology: DDPMs on the Patch Camelyon Dataset

<div style="display:flex;gap:0.5rem;justify-content:center;margin:1.5rem 0;flex-wrap:wrap"><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/cancerous/cancerous0.jpeg" alt="Cancerous patch" style="width:23%;border-radius:6px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/cancerous/cancerous1.jpeg" alt="Cancerous patch" style="width:23%;border-radius:6px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/non_cancerous/non_cancerous0.jpeg" alt="Non-cancerous patch" style="width:23%;border-radius:6px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/non_cancerous/non_cancerous1.jpeg" alt="Non-cancerous patch" style="width:23%;border-radius:6px" /></div>

*Real PCam patches used in this project — H&E-stained tissue the DDPMs learn to synthesize from pure Gaussian noise.*

<div style="display:flex;gap:1rem;justify-content:center;margin:1.5rem 0"><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/assets/slide1.png" alt="Slide 1" style="width:49%;border-radius:8px;max-width:100%" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/assets/slide2.png" alt="Slide 2" style="width:49%;border-radius:8px;max-width:100%" /></div>

---

Generative AI has a well-known obsession with faces, landscapes, and anime characters. I wanted to ask a different question: what happens when you point a **Denoising Diffusion Probabilistic Model** at histopathologic tissue patches — and can you tell the difference between cancerous and non-cancerous samples just by looking at what the model generates?

This was my final project for **Computer Vision (CSCI-GA.2271, Fall 2022)**, using the **Patch Camelyon (PCam)** dataset. Here's everything I learned.

---

## The Dataset: Patch Camelyon

PCam is a binary image classification benchmark derived from the **Camelyon16** challenge on metastasis detection in lymph node sections. Each patch is:

| Property | Value |
|---|---|
| Image size | 96 × 96 px |
| Color space | RGB (H&E stained) |
| Total samples | 327,680 patches |
| Positive (cancerous) | 163,840 |
| Negative (non-cancerous) | 163,840 |
| Source | Radboud UMC + UMCU |

The class balance is perfect by construction. The challenge: **cancerous patches don't always look dramatically different**. Metastatic cells can be subtle, making this dataset hard for classifiers and, as I'd discover, interesting for generative models.

<div style="display:flex;gap:0.5rem;justify-content:center;margin:1.5rem 0;flex-wrap:wrap"><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/non_cancerous/non_cancerous2.jpeg" alt="Non-cancerous" style="width:18%;border-radius:6px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/non_cancerous/non_cancerous3.jpeg" alt="Non-cancerous" style="width:18%;border-radius:6px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/non_cancerous/non_cancerous4.jpeg" alt="Non-cancerous" style="width:18%;border-radius:6px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/cancerous/cancerous2.jpeg" alt="Cancerous" style="width:18%;border-radius:6px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gt_images/cancerous/cancerous3.jpeg" alt="Cancerous" style="width:18%;border-radius:6px" /></div>

*Actual PCam ground truth patches from the dataset. The differences are real but subtle — can you tell which are cancerous?*

---

## Why Diffusion Models?

By late 2022, DDPMs had just dethroned GANs as the state-of-the-art for image generation. The core insight behind them is elegant:

**Forward process** — systematically destroy an image by adding Gaussian noise over $T$ steps until it becomes pure noise:

$$q(x_t | x_{t-1}) = \\mathcal{N}\\left(x_t;\\, \\sqrt{1 - \\beta_t}\\, x_{t-1},\\; \\beta_t \\mathbf{I}\\right)$$

**Reverse process** — train a neural network to invert this, predicting the noise at each step:

$$p_\\theta(x_{t-1} | x_t) = \\mathcal{N}\\left(x_{t-1};\\, \\mu_\\theta(x_t, t),\\; \\Sigma_\\theta(x_t, t)\\right)$$

At inference time, you start from $x_T \\sim \\mathcal{N}(0, \\mathbf{I})$ and iteratively denoise. The model learns the distribution $p(x)$ implicitly, without an adversarial training loop. No mode collapse, no discriminator games — just a clean regression objective.

The training loss simplifies to predicting the noise $\\epsilon$ added at each step:

$$\\mathcal{L} = \\mathbb{E}_{x_0, \\epsilon, t}\\left[\\|\\epsilon - \\epsilon_\\theta(x_t, t)\\|^2\\right]$$

---

## Architecture: The U-Net Backbone

The denoising network is a **U-Net** — the same architecture that's been the workhorse of medical image segmentation since 2015. It's a natural fit: skip connections allow the model to preserve fine-grained spatial details while the bottleneck captures global structure.

![U-Net architecture](https://raw.githubusercontent.com/zhixuhao/unet/master/img/u-net-architecture.png)

*The U-Net encoder-decoder with skip connections — adapted for diffusion by injecting timestep embeddings at each layer.*

My implementation used:

- **Residual blocks** with group normalization (more stable than batch norm for small batch sizes)
- **Self-attention** at lower resolutions (16×16 and 8×8) to capture long-range dependencies
- **Sinusoidal time embeddings** — the same positional encoding trick from transformers, adapted for timestep conditioning:

$$\\text{TE}(t, 2i) = \\sin\\left(\\frac{t}{10000^{2i/d}}\\right), \\quad \\text{TE}(t, 2i+1) = \\cos\\left(\\frac{t}{10000^{2i/d}}\\right)$$

- **Linear noise schedule**: $\\beta_1 = 10^{-4}$, $\\beta_T = 0.02$ over $T = 1000$ steps

---

## Two Models, Not One

Rather than training a single conditional model (which would have been the "right" approach), I trained **two separate unconditional DDPMs** — one on cancerous patches only, one on non-cancerous only. This was partly a scope decision, partly curiosity: would the models learn visually distinguishable distributions?

The training loop followed the standard DDPM recipe:

1. Sample $x_0$ from the dataset
2. Sample timestep $t \\sim \\text{Uniform}(1, T)$
3. Sample noise $\\epsilon \\sim \\mathcal{N}(0, \\mathbf{I})$
4. Compute $x_t = \\sqrt{\\bar{\\alpha}_t}\\, x_0 + \\sqrt{1 - \\bar{\\alpha}_t}\\, \\epsilon$ where $\\bar{\\alpha}_t = \\prod_{s=1}^{t}(1 - \\beta_s)$
5. Predict $\\hat{\\epsilon} = \\epsilon_\\theta(x_t, t)$ and backpropagate $\\|\\epsilon - \\hat{\\epsilon}\\|^2$

Training ran on **Google Colab** with A100 GPUs — and I built a resume-from-checkpoint system to handle session timeouts, since Colab's free tier would cut me off mid-run.

---

## Ablation Studies

The most valuable part of this project was the systematic ablation. I tested two binary hyperparameters:

| Factor | Option A | Option B |
|---|---|---|
| Noise schedule | Linear $\\beta$ | Cosine $\\beta$ |
| Attention | With self-attention | Without self-attention |

This gave **4 model configurations per class** (8 total), each trained for 100 epochs. Evaluation metrics:

**SSIM (Structural Similarity Index)** — measures perceptual similarity between generated and real images:

$$\\text{SSIM}(x, y) = \\frac{(2\\mu_x\\mu_y + c_1)(2\\sigma_{xy} + c_2)}{(\\mu_x^2 + \\mu_y^2 + c_1)(\\sigma_x^2 + \\sigma_y^2 + c_2)}$$

**Log-likelihood** — evaluated via the DDPM variational lower bound (ELBO).

### Results

| Schedule | Attention | SSIM ↑ | Log-likelihood ↑ |
|---|---|---|---|
| Cosine | No attention | **0.74** | **−3.21** |
| Cosine | Attention | 0.71 | −3.38 |
| Linear | No attention | 0.68 | −3.52 |
| Linear | Attention | 0.65 | −3.71 |

**Winner: cosine schedule + no attention.**

This was somewhat surprising — I expected attention to help. The likely explanation: at 96×96, the receptive field of residual convolutions is already large enough to capture the relevant spatial structure. Attention at this resolution adds compute overhead without meaningful benefit, and may even hurt by introducing noise in the attention weights during early training.

The cosine schedule advantage aligns with the original IDDPM paper (Nichol & Dhariwal, 2021) — linear schedules can over-destroy the image in early timesteps, while cosine schedules maintain more signal:

$$\\bar{\\alpha}_t^{\\text{cosine}} = \\frac{f(t)}{f(0)}, \\quad f(t) = \\cos^2\\left(\\frac{t/T + s}{1 + s} \\cdot \\frac{\\pi}{2}\\right)$$

![Cosine vs linear noise schedule](https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/assets/slide2.png)

*From the paper: cosine vs. linear noise schedules — the cosine schedule preserves more structure in early timesteps.*

---

## What Does Reverse Diffusion Look Like?

Starting from pure Gaussian noise, the model progressively refines — dark nuclei emerge from color blobs, glandular structures sharpen, and fine chromatin detail resolves in the final steps. The model was never told what a nucleus looks like; it inferred the distribution of H&E staining entirely from data.

Here are four samples from the winning configuration (cosine schedule, no attention) — can *you* guess which are cancerous and which aren't?

<div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin:1.5rem 0"><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gifs/cosine_beta_schedule-no_attention05-interval10.gif" alt="Reverse Diffusion 1" style="width:49%;border-radius:8px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gifs/cosine_beta_schedule-no_attention26-interval10.gif" alt="Reverse Diffusion 2" style="width:49%;border-radius:8px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gifs/cosine_beta_schedule-no_attention43-interval10.gif" alt="Reverse Diffusion 3" style="width:49%;border-radius:8px" /><img src="https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/images/gifs/cosine_beta_schedule-no_attention47-interval10.gif" alt="Reverse Diffusion 4" style="width:49%;border-radius:8px" /></div>

---

## Lessons & Future Work

### What I'd do differently

1. **Train a conditional DDPM** — A single model conditioned on class label $c$ would be cleaner and more practical:
$$p_\\theta(x_{t-1} | x_t, c) = \\mathcal{N}\\left(x_{t-1};\\, \\mu_\\theta(x_t, t, c),\\; \\Sigma_\\theta(x_t, t, c)\\right)$$

2. **Scale to 96×96 native resolution** — I downsampled to 64×64 for compute reasons. Native resolution would preserve the fine chromatin detail that pathologists actually use for diagnosis.

3. **Use FID as the primary metric** — SSIM is a reasonable proxy but Fréchet Inception Distance better captures perceptual quality and distribution coverage.

4. **Classifier-free guidance** — Post-2022 advances like CFG dramatically improve sample quality with minimal overhead.

5. **Multi-GPU with Kubernetes** — Training 8 models sequentially was tedious. Parallel runs would have cut the experimental cycle from weeks to days.

### What I learned

Medical imaging is a different beast from natural images. The H&E staining colors aren't aesthetic choices — they carry diagnostic meaning. Augmentation strategies that work for ImageNet (hue jitter, color shift) actively harm performance on histopathology. The domain prior matters.

More broadly: diffusion models are remarkable at capturing **texture distributions**. Even at 64×64, the generated patches have the right "feel" — the granularity of the tissue, the density of nuclei, the eosin-to-hematoxylin ratio. A pathologist might not be fooled, but they'd recognize the tissue type.

---

## Citations & Sources

| # | Reference | Type | Link |
|---|---|---|---|
| 1 | Ho, J., Jain, A., & Abbeel, P. (2020). *Denoising Diffusion Probabilistic Models*. NeurIPS 2020. | Paper | [arxiv.org/abs/2006.11239](https://arxiv.org/abs/2006.11239) |
| 2 | Nichol, A., & Dhariwal, P. (2021). *Improved Denoising Diffusion Probabilistic Models*. ICML 2021. | Paper | [arxiv.org/abs/2102.09672](https://arxiv.org/abs/2102.09672) |
| 3 | Ronneberger, O., Fischer, P., & Brox, T. (2015). *U-Net: Convolutional Networks for Biomedical Image Segmentation*. MICCAI 2015. | Paper | [arxiv.org/abs/1505.04597](https://arxiv.org/abs/1505.04597) |
| 4 | Veeling, B., Linmans, J., Winkens, J., Cohen, T., & Welling, M. (2018). *Rotation Equivariant CNNs for Digital Pathology*. MICCAI 2018. | Dataset | [arxiv.org/abs/1806.03962](https://arxiv.org/abs/1806.03962) |
| 5 | Bándi, P. et al. (2018). *From Detection of Individual Metastases to Classification of Lymph Node Status at the Patient Level: The CAMELYON17 Challenge*. IEEE TMI. | Dataset | [doi.org/10.1109/TMI.2018.2867350](https://doi.org/10.1109/TMI.2018.2867350) |
| 6 | Wang, Z. et al. (2004). *Image Quality Assessment: From Error Visibility to Structural Similarity*. IEEE TIP. | Metric | [doi.org/10.1109/TIP.2003.819861](https://doi.org/10.1109/TIP.2003.819861) |
| 7 | Dhariwal, P., & Nichol, A. (2021). *Diffusion Models Beat GANs on Image Synthesis*. NeurIPS 2021. | Paper | [arxiv.org/abs/2105.05233](https://arxiv.org/abs/2105.05233) |
| 8 | Vaswani, A. et al. (2017). *Attention Is All You Need*. NeurIPS 2017. | Paper | [arxiv.org/abs/1706.03762](https://arxiv.org/abs/1706.03762) |
| 9 | Son, S. (2022). *DDPMs for Synthetic Histopathologic Image Generation*. NYU CSCI-GA.2271 Final Project. | Report | [GitHub PDF](https://raw.githubusercontent.com/sunnydigital/ddpm-histo-gen/main/DDPMs%20for%20Synthetic%20Histopathologic%20Image%20Generation%20Paper.pdf) |
| 10 | PCam Dataset — Patch Camelyon. Radboud UMC + UMCU. | Dataset | [github.com/basveeling/pcam](https://github.com/basveeling/pcam) |`,
    date: "2022-12-18",
    tags: ["Diffusion Models", "Medical Imaging", "Computer Vision", "PyTorch", "Deep Learning", "PCam"],
  },
  {
    id: "galaxy-portfolio",
    title: "Building a 3D Galaxy Portfolio with Three.js and Next.js",
    excerpt: "How and why I built this website — a 3D galaxy where every star is something I've learned. The full story: the idea, the tech decisions, what broke, and what I'd do differently.",
    content: `# Building a 3D Galaxy Portfolio with Three.js and Next.js

![Milky Way over the VLT](https://cdn.eso.org/images/screen/eso0627a.jpg)

*The Milky Way over the ESO's Very Large Telescope. This is roughly what I was going for.*

---

Most portfolio sites are lists. Here's my work history. Here are my skills. Here's my GitHub. They get the job done, but they don't say much about *how* the person thinks.

I've always thought of learning as something that accumulates in clusters, not lines. Concepts pull each other into orbit. Some ideas are foundational — dense, central, everything else revolves around them. Others sit on the periphery, loosely connected but still part of the same system. It looks less like a roadmap and more like a galaxy.

So I made that literal.

---

## The Idea

Every concept I've learned becomes a star. The site opens on a 3D galaxy — 7,000 background stars in a procedurally generated spiral, with brighter colored dots scattered through the arms representing things I actually know. Hover a dot, get a summary. Click it, go deeper.

But a static star map felt too... static. So there are three modes you can scroll through:

- **Galaxy** — concepts embedded in the spiral arms, auto-rotating
- **Clusters** — concepts rearranged by semantic similarity using UMAP + in-browser embeddings
- **Timeline** — concepts sorted chronologically and arranged as real constellations

The idea is that each mode tells a different story about the same knowledge. Galaxy shows breadth. Clusters shows how ideas relate. Timeline shows how I got here.

---

## The Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| 3D | Three.js via React Three Fiber |
| Post-processing | UnrealBloom (three/examples) |
| Embeddings | Hugging Face Transformers.js |
| Dim. reduction | UMAP-js (runs in-browser) |
| Math | KaTeX |
| Auth | NextAuth + Google OAuth |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

Everything computes live in the browser. The galaxy regenerates on every page load. Embeddings run client-side. Nothing is pre-baked.

---

## Building the Galaxy

![NGC 1300 spiral galaxy](https://esahubble.org/media/archives/images/screen/heic0503a.jpg)

*NGC 1300 — the reference. Dense core, outer haze, two spiral arms.*

Real galaxies have structure: a bright central core, a diffuse outer disk, and arms that wind outward in logarithmic spirals. I wanted to approximate that.

The 7,000 background stars are distributed across four zones. The core uses tight Gaussian sampling — most stars clumped near the center, with spread controlled by the standard deviation. The spiral arms work by generating Gaussian blobs and then wrapping them with a spiral transform: compute the polar angle from the arm offset, then rotate it further based on radius. The farther from the center, the more the arm has wound around:

$$\\theta = \\phi_{\\text{arm}} + \\arctan\\!\\left(\\frac{y}{x}\\right) + \\frac{r}{d} \\cdot k$$

Where $k = 3.0$ controls how tightly the arms wind. There's also a blue haze layer — soft, diffuse points with low opacity — that fills in the interstellar medium and gives the galaxy that soft nebular glow when the bloom hits it.

Star colors follow the real spectral distribution: 76% are warm orange K/G-type dwarfs, with rare blue-white O-type stars at the large end. The color and size both scale with spectral type.

All 7,000 stars are a single draw call — one \`BufferGeometry\` with packed position, color, and size arrays. With additive blending, overlapping stars brighten each other instead of occluding — that's what makes the core look genuinely luminous.

---

## Making It Glow: Unreal Bloom

The most impactful thing I added was post-processing bloom. Without it, the galaxy looks like a flat scatterplot. With it, the core pulses with light and the arms feel like they're made of something.

![bloom effect](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/screenshots/webgl_postprocessing_unreal_bloom.jpg)

*Before/after bloom — the bright pixels "bleed" into surrounding areas.*

The implementation uses Three.js's \`UnrealBloomPass\`, wired into an \`EffectComposer\` that replaces the default render loop. The key quirk: the bloom pass needs to run in a \`useFrame\` with priority \`1\`, *after* the standard render at priority \`0\`. Get that wrong and you get flickering.

Parameters took a lot of tuning. Strength at 1.5 gives the cosmic feel without washing out the spiral structure. Threshold at 0.2 catches the stars but ignores the dark background. Radius at 0.4 gives a moderate spread — higher and it starts looking like vaseline on the lens.

---

## The Three Modes

### Galaxy

The default. Concept dots get placed in the spiral arms alongside the background stars. The camera auto-rotates slowly. You can drag to orbit, right-click drag to zoom. The dots animate in on load.

### Clusters

This one required the most engineering. The idea: what if the *positions* of concept dots were driven by semantic meaning, not arbitrary placement?

I compute a 384-dimensional text embedding for every concept description using \`Xenova/all-MiniLM-L6-v2\` — Hugging Face Transformers.js, running entirely in-browser. Then UMAP reduces those 384-dimensional vectors to 3D coordinates:

$$\\text{embed}: \\text{description} \\to \\mathbb{R}^{384} \\xrightarrow{\\text{UMAP}} \\mathbb{R}^3$$

The result: concepts that are semantically similar end up near each other in 3D space. ML concepts cluster together. Web dev concepts form their own neighborhood. Things I learned around the same time and context naturally group up — not because I told them to, but because the geometry of meaning put them there.

I seed the UMAP PRNG so the layout is deterministic across sessions. Without a seed, it produces a different arrangement every run.

When you scroll from Galaxy to Clusters, the background stars scatter outward and fade — a dispersion animation that physically signals "you've left the galaxy." Each dot then smoothly flies from its arm position to its UMAP-computed cluster position over about 1.5 seconds, with a cubic ease-in-out curve so the motion feels physical and not robotic.

### Timeline

My favorite mode. Concepts are sorted by when I learned them, then assigned to real **constellations** — Orion, Cassiopeia, Ursa Major, Scorpius. The star positions come from actual astronomical coordinates, scaled to scene units. Each constellation's stick-figure lines are drawn with \`LineBasicMaterial\`, and inter-constellation connections use dashed lines to show the narrative thread between groups.

![Orion constellation](https://cdn.eso.org/images/screen/eso0102a.jpg)

*The Orion nebula (ESO) — a reminder that even the night sky is data. The constellation's star positions are used to arrange concepts chronologically in the Timeline mode.*

The sequencing of the animation matters a lot here. When you enter Timeline mode, the dots move first — taking about 1.6 seconds to settle into their positions. Only *then* do the constellation lines fade in. If they appeared immediately, you'd see them stretched across the screen before the dots arrived, which looks broken. Leaving Timeline is the reverse: lines fade out first, *then* the dots move. It took a few iterations to get this order right.

Date labels and constellation names float above each grouping. Concept name labels appear below each dot. All of these are \`@react-three/drei\` \`Html\` components — DOM elements projected into 3D space via CSS transforms, which means they interact with the layout engine. I throttle position updates to every 10 frames to prevent layout thrash.

---

## Scroll Behavior

Getting the scroll to feel right was the trickiest part of the whole build.

The galaxy occupies the full viewport. Scrolling *through* it shouldn't scroll the page — it should cycle through the three modes. Only after the third mode should the page continue scrolling to the sections below.

This means intercepting \`wheel\` events with \`{ passive: false }\` at the document level and calling \`preventDefault()\` when the visualization is in view. There's a debounce to prevent rapid-fire mode switching on high-velocity scrolls, and a "snap" system that detects when the user is stuck between the galaxy and the page content and resolves it cleanly.

Scrolling back up from the content section re-engages the galaxy. The transition back into Galaxy mode plays the dispersion animation in reverse — stars gather from their scattered positions back into the spiral.

---

## Everything Else

**KaTeX** — every description, post, and project on the site renders LaTeX. Display math with \`$$...$$\`, inline with \`$...$\`. A heuristic guards against treating prices like \$100M as math expressions. This matters for a portfolio in ML/research — you want to write $\\hat{y} = \\sigma(Wx + b)$ without workarounds.

**Dark/light mode** — full theme toggle with CSS variables throughout. The galaxy adapts: dark mode is deep space, light mode is more like a cloudy day (still looks fine, if less dramatic).

**CMS** — sign in with Google (allowlisted to my account) and you can create, edit, or delete posts, projects, and concepts directly on the live site. No separate admin panel. It saves to Supabase and immediately reflects on the page.

**Concepts** — the starred items in the galaxy. Each has a short summary, a long summary, a date learned, and a 3D position. The short summary is editable in place. The galaxy literally grows when I add new ones.

---

## What I'd Do Differently

A few things I'd change if I were starting fresh:

- **UMAP in a Web Worker** — it runs on the main thread right now, which causes a ~200ms freeze on first load. Easy fix I haven't gotten around to.
- **Shader-based star glow** — currently the glow is a radial gradient baked into a canvas texture. A GLSL fragment shader would be cleaner and more flexible.
- **Lazy-loaded embeddings** — the Transformers.js model is large. Deferring it until Clusters mode is first requested would improve initial load time.
- **More constellations** — the Timeline runs out of defined constellations if you add enough concepts. I need to define more or build a procedural fallback.

---

## Resources

- 💻 [GitHub](https://github.com/sunnydigital/sunny-portfolio)
- 📖 [Three.js Docs](https://threejs.org/docs/)
- 📖 [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- 📖 [UMAP Paper — McInnes et al., 2018](https://arxiv.org/abs/1802.03426)
- 📖 [Ho et al. DDPM — for the bloom inspiration](https://arxiv.org/abs/2006.11239)`,
    date: "2024-08-05",
    tags: ["Three.js", "Next.js", "WebGL", "Portfolio", "UMAP", "React Three Fiber"],
  },
];

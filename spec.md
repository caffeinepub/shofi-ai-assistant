# Shofi AI Assistant

## Current State
New project — no existing files.

## Requested Changes (Diff)

### Add
- Shofi AI assistant web app with voice interaction
- Wake word detection: user says "Shofi" → Shofi responds "Yes Master"
- Personality commands: "DO YOU LOVE ME" → "YES I LOVE YOU, MASTER"
- Continuous voice listening via Web Speech API (SpeechRecognition)
- Sweet, calm female TTS voice via Web Speech Synthesis API (female voice selection)
- Command system: pre-set commands mapped to responses (greetings, love, status, help, etc.)
- Research capability: user asks Shofi to search/research a topic, backend does HTTP outcall to DuckDuckGo Instant Answer API, returns result
- Simulated phone commands: "SHOFI CALL [name]" shows a call simulation UI (note: real phone calls not possible in a web app)
- Backend stores: conversation history, custom user commands, contact list
- Beautiful animated Shofi avatar (glowing orb/circle with pulse animation when listening/speaking)
- Chat log showing conversation history
- Commands reference panel
- Microphone toggle for voice activation

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - Store conversation messages (timestamp, speaker, text)
   - Store custom commands (trigger phrase → response)
   - Store contacts (name → phone number display)
   - HTTP outcall to DuckDuckGo for research queries
   - Seed with default commands and contacts
2. Frontend (React/TypeScript):
   - Animated Shofi avatar component (orb with glow, pulse states: idle/listening/speaking)
   - Voice recognition hook using Web Speech API
   - TTS hook using Web Speech Synthesis with female voice
   - Wake word detection in transcript
   - Command matching engine (fuzzy match on pre-set and user-defined commands)
   - Research query → backend HTTP outcall → display result
   - Chat log component
   - Commands panel (collapsible)
   - Mobile-first responsive layout
3. Note: Real phone control, working when phone is off, and actual phone calls are not possible in a web app. The app simulates these interactions.

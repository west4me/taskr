# taskr 🚀

A gamified task management app that combines productivity with engagement. Built with React and Firebase, taskr helps you stay organized while making task completion more rewarding.

## Features

### Core Functionality
- 🎮 Gamified Task Tracking - Earn XP and level up as you complete tasks
- 📊 Multiple Views - Kanban board, Calendar view, and List view for flexible task management
- 🏆 Achievement System - Unlock badges and track your progress
- 📱 Responsive Design - Works seamlessly across desktop and mobile devices
- 🔄 Real-time Updates - Changes sync instantly across all devices

### Task Management
- 💪 Task Prioritization - Set difficulty and priority levels
- 📝 Rich Text Editing - Full markdown support for task descriptions
- 🏷️ Project Organization - Group tasks by projects
- 📅 Deadline Management - Set and track task due dates
- 💬 Comments System - Collaborate through task comments
- 🗄️ Archive System - Keep your workspace clean while maintaining history

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion
- @hello-pangea/dnd (Drag and Drop)
- TipTap (Rich Text Editing)

### Backend
- Firebase Authentication
- Firebase Firestore
- Firebase Security Rules

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
    git clone https://github.com/yourusername/taskr.git
    cd taskr
2. Install dependencies:
   ```bash
   npm install  
3. Set up your Firebase configuration:
   - Create a new Firebase project
   - Enable Authentication and Firestore
   - Create a .env file in the root directory:
     ``` env
     - VITE_FIREBASE_API_KEY=your_api_key
     - VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     - VITE_FIREBASE_PROJECT_ID=your_project_id
     - VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     - VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     - VITE_FIREBASE_APP_ID=your_app_id
4. Start the development server:
   ```bash
    npm run dev 
   ```


## Features In Detail

### Task Management
* Create, edit, and delete tasks
* Set task difficulty (Easy, Medium, Hard)
* Set priority levels (Low, Medium, High)
* Add rich text descriptions
* Set deadlines
* Assign to projects
* Track completion status

### Views
* **Kanban Board**: Drag-and-drop task management
* **Calendar View**: Deadline-based task visualization
* **List View**: Searchable, filterable task list

### Progress System
* XP-based leveling system
* Daily streaks
* Achievement badges
* Progress visualization

### User Experience
* Responsive design
* Dark theme
* Real-time updates
* Toast notifications
* Keyboard shortcuts

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

* Icons from Lucide React
* UI components inspired by shadcn/ui
* Firebase for backend services
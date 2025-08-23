# ✈️ Airlane - Professional BPMN 2.0 Process Modeling Platform

[![GitHub](https://img.shields.io/github/license/MarcusNeufeldt/airlane)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%5E18.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E4.0-blue)](https://www.typescriptlang.org/)
[![BPMN](https://img.shields.io/badge/BPMN-2.0-green)](https://www.bpmn.org/)

A professional BPMN 2.0 process modeling platform with enterprise-grade UX features, Signavio compatibility, AI-powered process generation, and universal format support. Create, import, and analyze business processes with design-tool quality visual features and intelligent automation.

## ✨ Features

### 🎯 **BPMN 2.0 Compliance**
- **Complete Element Library** - Events, Tasks, Gateways, Lanes, Pools, Data Objects
- **Professional Interface** - Signavio-style visual design with hover effects and proper handles
- **Universal Import/Export** - Compatible with Signavio, Camunda, Bizagi, and other BPMN tools
- **Lane Organization** - Color-coded organizational lanes with toggle-able visual indicators
- **Smart Connections** - Dynamic handle mapping for all node types with intelligent routing
- **Process Validation** - Real-time BPMN compliance checking with comprehensive error reporting

### 🤖 **AI-Powered Process Generation** 
- **OpenRouter Integration** - Powered by Google Gemini 2.5 Flash with reasoning models
- **Smart Node Prediction** - AI analyzes process context and suggests next logical nodes
- **Context-Aware Naming** - AI suggests professional BPMN node names with complete process analysis
- **Raw BPMN XML Context** - AI receives industry-standard XML for precise business intelligence
- **AI Preview Mode** - Accept/Decline/Retry interface for all AI suggestions
- **Natural Language Processing** - Generate complete business processes from descriptions
- **Intelligent Process Analysis** - AI-powered recommendations and optimization insights
- **Context-Aware Generation** - AI understands current process state for smart suggestions
- **Incremental Updates** - AI can modify existing processes without full regeneration
- **Process Optimization** - Identify bottlenecks and suggest improvements

### 🎨 **Enterprise-Grade Visual & UX Features**
- **QuickNodeSelector System** - Professional click-to-place node creation with directional positioning
- **Dynamic Alignment Guides** - Real-time red center-line guides while dragging (like Figma/Sketch)
- **Perfect Node Positioning** - Node-type aware dimensions with automatic center alignment
- **Smart Connection Arrows** - Fixed arrow directions with proper handle mapping for all connection types
- **BPMN-Compliant Styling** - Professional visual hierarchy with proper boxes and connection points
- **Magnetic Grid System** - Snap-to-grid functionality for precise alignment
- **Comprehensive Undo/Redo** - Full history tracking for all operations
- **Collaboration Tools** - Sticky notes and background shapes for team communication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarcusNeufeldt/er_diagram_scema_app.git
   cd er_diagram_scema_app
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy example environment file
   cd ../server
   cp .env.example .env
   
   # Edit .env and add your OpenRouter API key
   # OPENROUTER_API_KEY=your-api-key-here
   ```

4. **Start the application**
   ```bash
   # From project root
   cd server && npm run dev    # Terminal 1: Start server
   cd client && npm start      # Terminal 2: Start client
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Start creating professional BPMN process diagrams!

## 🎮 Usage Guide

### 🎯 **Professional Process Modeling**
1. **QuickNodeSelector**: Click any node → choose direction → select node type for instant placement
2. **Visual Alignment**: Red center-line guides appear automatically while dragging nodes
3. **Perfect Connections**: Automatic connection creation with proper handle mapping
4. **Smart Positioning**: Node-type aware dimensions ensure perfect center alignment

### 📋 **Creating BPMN Processes**
1. **Start Events**: Add start events to begin your process flows
2. **Process Tasks**: Use the toolbar or QuickNodeSelector to add tasks, gateways, and events
3. **Connections**: Drag between connection handles to create sequence flows
4. **Data Objects**: Add data inputs/outputs with proper BPMN styling
5. **Lanes & Pools**: Organize processes by participants and departments

### 🎨 **Visual Organization**
- **Alignment Guides**: Professional center-line alignment while dragging (red guides)
- **Snap-to-Grid**: Toggle grid snap for precise alignment with visual feedback
- **Lane Colors**: Toggle colored organizational indicators in the View menu
- **BPMN Import/Export**: Universal compatibility with Signavio, Camunda, Bizagi
- **Context Menus**: Right-click elements for quick actions and modifications

### 🤖 **AI-Powered Smart Features**
- **AI Smart Node**: Click any node → "AI Smart Node" button for intelligent next node suggestions
- **Smart Renaming**: Click the edit icon in QuickNodeSelector for context-aware naming suggestions
- **AI Preview Mode**: Accept/Decline/Retry interface for all AI recommendations
- **Open Chat**: Click "AI Assistant" to open the intelligent process chat panel
- **Natural Language**: Describe business processes in plain English
- **Example Prompts**:
  - "Create a customer onboarding process with approval steps"
  - "Design an order fulfillment workflow with inventory checks"
  - "Add error handling and exception flows to this process"
  - "Analyze this process for optimization opportunities"

### ⚡ **Productivity Features**
- **Keyboard Shortcuts**: Comprehensive shortcuts for all operations
- **Undo/Redo**: Full history tracking (Ctrl+Z/Ctrl+Y) for all changes
- **Property Panel**: Select elements for detailed BPMN property editing
- **Process Validation**: Real-time BPMN compliance checking with error reporting
- **Multi-Selection**: Ctrl+Click for bulk operations and alignment tools

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Required |
| `DEFAULT_AI_MODEL` | AI model to use | `google/gemini-2.5-flash` |
| `ENABLE_REASONING` | Enable thinking models | `true` |
| `REASONING_EFFORT` | Reasoning effort level | `medium` |
| `PORT` | Server port | `4000` |

### Reasoning Configuration
- **Effort Levels**: `high`, `medium`, `low`, `custom`
- **Cost Control**: Set `ENABLE_REASONING=false` to reduce API costs
- **Custom Tokens**: Use `REASONING_EFFORT=custom` for precise control

## 🧪 Testing

```bash
# Run AI service tests
cd server
node test-ai.js

# Run auto-layout tests
node test-auto-layout-demo.js

# Run comprehensive test suite
node test-summary.js
```

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/
├── server/                 # Node.js backend
│   ├── ai-service.js       # OpenRouter AI integration
│   ├── server.js           # WebSocket server
│   └── test-*.js           # Test files
└── README.md
```

## 🎯 Key Technologies

- **Frontend**: React 18, TypeScript, ReactFlow, Zustand, TailwindCSS, Lucide Icons
- **Backend**: Node.js, WebSocket, Y.js (real-time collaboration)
- **AI**: OpenRouter API, Google Gemini 2.5 Flash, Reasoning Models
- **Database**: JSON-based storage with extensible architecture
- **Visualization**: ReactFlow with custom nodes, NodeResizer, magnetic grid system
- **State Management**: Zustand with comprehensive undo/redo history tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI model access
- **ReactFlow** for diagram visualization
- **Y.js** for real-time collaboration
- **Zustand** for state management

## 🎬 **Recent Updates**

### v3.1 - AI Smart Features (January 2025)
- ✅ **AI Smart Node System** - Intelligent next node prediction with Accept/Decline/Retry interface
- ✅ **Smart Node Renaming** - Context-aware AI naming suggestions with complete process analysis
- ✅ **Raw BPMN XML Context** - Industry-standard XML schema sent to AI for precise business intelligence
- ✅ **AI Preview Mode** - Visual node preview with confidence indicators and collapsible reasoning
- ✅ **Separated AI Architecture** - Modular AI services with dedicated naming and prediction features

### v3.0 - Professional Design Tool Features (January 2025)
- ✅ **QuickNodeSelector System** - Professional click-to-place node creation with directional positioning
- ✅ **Dynamic Alignment Guides** - Real-time red center-line guides while dragging (like Figma/Sketch)
- ✅ **Perfect Node Positioning** - Node-type aware dimensions with automatic center alignment  
- ✅ **Smart Connection System** - Fixed arrow directions with proper handle mapping
- ✅ **BPMN Visual Polish** - Enhanced data objects with proper boxes and connection points
- ✅ **Multi-Selection Support** - Ctrl+Click prevention for QuickNodeSelector compatibility
- ✅ **Professional UX** - Enterprise-grade visual feedback and interaction patterns

### v2.5 - BPMN Import/Export & Lane System (August 2025)
- ✅ **Universal BPMN Import** - Compatible with Signavio, Camunda, Bizagi, and other BPMN tools
- ✅ **Lane Visual System** - Color-coded organizational lanes with toggle functionality
- ✅ **Smart XML Parsing** - Robust coordinate extraction and layout preservation
- ✅ **Dynamic Handle Mapping** - Intelligent connection handle assignment
- ✅ **Process Validation** - Real-time BPMN compliance checking
- ✅ **AI Process Generation** - Full backend integration with OpenRouter API

## 🔗 Links

- **Repository**: [GitHub](https://github.com/MarcusNeufeldt/er_diagram_scema_app)
- **Issues**: [GitHub Issues](https://github.com/MarcusNeufeldt/er_diagram_scema_app/issues)
- **Releases**: [GitHub Releases](https://github.com/MarcusNeufeldt/er_diagram_scema_app/releases)

---

Made with ❤️ for the database design community | Powered by AI
Of course! That's an excellent idea for a quick-action. It leverages the AI for a practical, value-added task that directly enhances the diagram's documentation.

Here is a complete, step-by-step implementation to add this "Summarize on Sticky Note" feature. The plan is as follows:

1.  **Backend (`ai-service.js`):** Create a new method to generate a concise summary from a process model.
2.  **API (`consolidated.js`):** Add a new `/summarize-process` endpoint to expose this functionality.
3.  **Frontend Service (`aiService.ts`):** Create a new method to call this endpoint.
4.  **Zustand Store (`diagramStore.ts`):** Update `addStickyNote` to accept initial content.
5.  **UI (`AIChatPanel.tsx`):** Add the new quick-action button and its handler function.

---

### Step 1: Add Summarization Logic to the Backend AI Service

First, we need to teach our AI service how to generate a summary. We'll add a new method with a very specific prompt to ensure the output is concise.

**In `api/_lib/ai-service.js`:**

Add this new `summarizeProcess` method to the `AIService` class. A good place is after `analyzeProcess`.

```javascript
// In api/_lib/ai-service.js, inside the AIService class

async summarizeProcess(process) {
    try {
      console.log('📝 Starting process summarization');
      const prompt = `You are an expert BPMN process analyst. Analyze the following BPMN process model and provide a very concise, one-paragraph summary (maximum 3-4 sentences). 
      
      Your summary should describe the main purpose, key stages, and primary outcome of the process. 
      
      CRITICAL: Respond ONLY with the plain text summary. Do not use formatting, markdown, lists, or introductory phrases like "This process describes...".

      Process Model:
      ${JSON.stringify(process, null, 2)}`;
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 150,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://signavio.vercel.app',
          'X-Title': 'BPMN Process Modeling Tool'
        }
      });
      
      const summary = response.data.choices[0].message.content.trim();
      console.log('✅ Summarization complete:', summary);
      return summary;

    } catch (error) {
      console.error('Process Summarization Error:', error.response?.data || error.message);
      throw new Error(`Process summarization failed: ${error.response?.data?.error?.message || error.message}`);
    }
}
```

### Step 2: Create the API Endpoint

Now, let's expose this new function through our main API handler.

**In `api/consolidated.js`:**

Add this new `if` block inside the main `try` block, for example after the `/analyze-process` endpoint.

```javascript
// In api/consolidated.js

if (method === 'POST' && url.includes('/summarize-process')) {
    try {
        const { process } = body;
        if (!process || !process.elements || process.elements.length === 0) {
            return res.status(400).json({ error: 'Process model is required and must not be empty.' });
        }
        console.log('🔬 Summarizing process...');
        const aiService = new AIService();
        const summary = await aiService.summarizeProcess(process);
        console.log('✅ Summary generated.');
        return res.json({ summary });
    } catch (error) {
        console.error('❌ Process summarization failed:', error.message);
        return res.status(500).json({ error: 'Failed to summarize process', details: error.message });
    }
}
```

### Step 3: Add the Frontend Service Method

Let's add the corresponding method in our frontend service to call the new endpoint.

**In `client/src/services/aiService.ts`:**

Add this new `summarizeProcess` method to the `AIService` class.

```typescript
// In client/src/services/aiService.ts, inside the AIService class

async summarizeProcess(process: ProcessModel): Promise<string> {
    console.log('📝 Requesting process summary from backend...');
    const response = await fetch(`${API_BASE_URL}/summarize-process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ process }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to summarize process');
    }

    const data = await response.json();
    console.log('✅ Received summary:', data.summary);
    return data.summary;
}
```

### Step 4: Update the Zustand Store

We need to modify `addStickyNote` so we can pass in the summary content when creating it.

**In `client/src/stores/diagramStore.ts`:**

1.  Find the `addStickyNote` signature in the `DiagramState` interface and update it:
    ```typescript
    // Change this:
    addStickyNote: (position: { x: number; y: number }) => void;
    
    // To this:
    addStickyNote: (position: { x: number; y: number }, content?: string) => void;
    ```
2.  Now, find the implementation of `addStickyNote` and update it to use the new `content` parameter:
    ```typescript
    // Change this:
    addStickyNote: (position) => {
        // ...
        const stickyData: StickyNoteData = {
            id: `sticky-${Date.now()}`,
            content: 'New Note', // <-- This is hardcoded
            //...
        };
        // ...
    },

    // To this:
    addStickyNote: (position, content = 'New Note') => { // Add content parameter with default
        const { snapToGrid, gridSize } = get();
        const snappedPosition = snapToGridPosition(position, gridSize, snapToGrid);
        const id = `sticky-${Date.now()}`;
        const stickyData: StickyNoteData = {
            id,
            nodeType: 'sticky-note',
            content, // <-- Use the passed content
            color: '#FFF9C4',
            width: 200,
            height: 150,
        };
        const newNode: Node = {
            id,
            type: 'sticky-note',
            position: snappedPosition,
            data: stickyData,
        };
        setStateWithHistory({ nodes: [...get().nodes, newNode] }, 'Add Sticky Note');
    },
    ```

### Step 5: Add the Quick Action to the UI

Finally, let's add the button and the logic to tie everything together.

**In `client/src/components/AIChatPanel.tsx`:**

1.  Destructure `addStickyNote` from the `diagramStore`:
    ```typescript
    const { nodes, edges, importDiagram, flashTable, isReadOnly, currentDiagramId, addStickyNote } = useDiagramStore();
    ```

2.  Create the handler function for our new action. Place this function inside the `AIChatPanel` component, for example, after `handleAnalyzeProcess`.
    ```typescript
    const handleSummarizeProcess = async () => {
        const currentProcess = getCurrentProcess();
        if (!currentProcess || currentProcess.elements.length === 0) {
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'There is no process on the canvas to summarize. Please add some elements first.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        setIsGenerating(true);
        const thinkingMessage: ChatMessage = {
            role: 'assistant',
            content: 'Analyzing your process to create a summary...',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            const summary = await aiService.summarizeProcess(currentProcess);

            // Find a good position for the sticky note (e.g., near the start event)
            const startEvent = nodes.find(n => n.type === 'event' && n.data.eventType === 'start');
            const position = startEvent 
                ? { x: startEvent.position.x - 220, y: startEvent.position.y } 
                : { x: 50, y: 50 };

            addStickyNote(position, summary);
            
            const successMessage: ChatMessage = {
                role: 'assistant',
                content: `✅ I've summarized the process and added it to a sticky note on your canvas.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, successMessage]);

        } catch (error) {
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: `Failed to summarize the process: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
    };
    ```

3.  Add the new action to the `quickActions` array:
    ```typescript
    const quickActions = [
      {
        label: 'Generate Customer Onboarding Process',
        action: () => handleGenerateProcess('Create a customer onboarding process with registration, verification, and welcome steps'),
      },
      {
        label: 'Generate Order Fulfillment Process',
        action: () => handleGenerateProcess('Create an order fulfillment process with order processing, inventory check, shipping, and delivery'),
      },
      {
        label: 'Analyze Current Process',
        action: handleAnalyzeProcess,
      },
      // Add the new action here
      {
        label: 'Summarize Process on Sticky Note',
        action: handleSummarizeProcess,
      },
    ];
    ```

### What the Result Will Be

Now, when you run the application:
1.  The AI Panel will show a new quick action: "Summarize Process on Sticky Note".
2.  Clicking it will trigger the `handleSummarizeProcess` function.
3.  It will grab the current state of your canvas and send it to your backend.
4.  The backend will use the specific prompt to get a concise summary from the AI.
5.  The summary text will be sent back to the frontend.
6.  A new sticky note will be created on the canvas near your start event, containing the AI-generated summary.
7.  A confirmation message will appear in the chat panel.

This creates a seamless, powerful, and very useful feature that bridges the gap between AI analysis and practical diagram documentation.
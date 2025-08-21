# Process Pipeline Creator - User Guide

## Getting Started

The Process Pipeline Creator is a visual tool for designing business processes, similar to Signavio or other BPMN modeling tools. Create workflows using events, tasks, and gateways connected by sequence flows.

## Core Elements

### Events (Green Circles)
Events represent things that happen in your process.

#### Types:
- **Start Event**: Beginning of the process (solid green border)
- **Intermediate Event**: Something that happens during the process (dashed yellow border)  
- **End Event**: Conclusion of the process (thick red border)

#### How to Use:
1. Click the **Event** button in the toolbar
2. Click on the canvas to place the event
3. Double-click to edit the label
4. Use the property panel to change the event type

### Tasks (Blue Rectangles)
Tasks represent work that needs to be done.

#### Types:
- **Task**: A single activity (thin border)
- **Subprocess**: A complex activity that contains other processes (thick border)

#### How to Use:
1. Click the **Task** button in the toolbar
2. Place on canvas and edit the label
3. Set type to Task or Subprocess in properties
4. Add descriptions for clarity

### Gateways (Yellow Diamonds)
Gateways control the flow of your process.

#### Types:
- **Exclusive (XOR)**: Choose one path
- **Parallel (AND)**: Execute all paths simultaneously
- **Inclusive (OR)**: Execute one or more paths

#### How to Use:
1. Click the **Gateway** button in the toolbar
2. Position where decisions need to be made
3. Connect to multiple outgoing paths
4. Use properties to set gateway type and criteria

## Creating Connections

### Sequence Flows
Connect process elements to show the order of activities.

#### Steps:
1. Hover over an element to see connection handles
2. Drag from a handle to another element
3. Release to create the connection
4. Connections automatically get arrow markers

### Connection Tips:
- Elements have handles on all sides (top, right, bottom, left)
- Drag to the target element or its handles
- Invalid connections are prevented automatically

## Editing Properties

### Property Panel
Select any element to see its properties in the right panel.

#### For Tasks:
- **Name**: What the task does
- **Type**: Task vs Subprocess
- **Description**: Detailed explanation

#### For Events:
- **Name**: Event description
- **Type**: Start, Intermediate, or End
- **Description**: When this event occurs

#### For Gateways:
- **Label**: Short identifier
- **Type**: Exclusive, Parallel, or Inclusive  
- **Description**: Decision criteria

## Canvas Navigation

### Basic Controls
- **Zoom**: Mouse wheel or zoom controls
- **Pan**: Click and drag empty canvas area
- **Fit View**: Green "Fit View" button centers all elements

### Multi-Selection
- **Ctrl+Click**: Add/remove elements from selection
- **Drag Selection**: Box select multiple elements
- **Alignment Tools**: Appear when 2+ elements selected

## File Operations

### Saving & Loading
- **Save**: Saves to your account (if logged in)
- **Import**: Load JSON process files
- **Export JSON**: Download your process as JSON
- **Export PNG**: Save visual diagram as image

### Search
- **Ctrl+F**: Open search dialog
- **Find Elements**: Search by name or description
- **Navigate Results**: Use arrow keys or buttons

## Collaboration Features

### Real-time Editing
- **Multi-user**: Multiple people can edit simultaneously
- **Lock Indicators**: See who's editing what
- **Auto-sync**: Changes appear in real-time

### Version Control
- **Undo/Redo**: Full history with Ctrl+Z/Ctrl+Y
- **Auto-save**: Periodic saves prevent data loss

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Open search |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Delete` | Delete selected elements |
| `Ctrl+A` | Select all |
| `Escape` | Clear selection |

## Best Practices

### Process Design
1. **Start with Events**: Begin and end every process
2. **Clear Labels**: Use descriptive task names
3. **Logical Flow**: Ensure processes make business sense
4. **Gateway Logic**: Document decision criteria

### Visual Layout
1. **Left to Right**: Standard process flow direction
2. **Consistent Spacing**: Use alignment tools
3. **Minimize Crossings**: Keep flows clean
4. **Group Related**: Use proximity for related tasks

### Documentation
1. **Add Descriptions**: Use property panel descriptions
2. **Sticky Notes**: Add process annotations
3. **Export Images**: Share visual documentation

## Common Patterns

### Simple Linear Process
```
[Start] → [Task 1] → [Task 2] → [End]
```

### Decision Process
```
[Start] → [Task] → [Gateway] → [Task A] → [End]
                      ↓
                   [Task B] → [End]
```

### Parallel Activities
```
[Start] → [Split Gateway] → [Task A] → [Join Gateway] → [End]
              ↓                            ↑
           [Task B] ―――――――――――――――――――――――
```

## Troubleshooting

### Common Issues
- **Can't Connect**: Check if elements are compatible
- **Elements Missing**: Use search to find hidden elements
- **Performance Issues**: Limit to <100 elements per diagram
- **Save Failures**: Check internet connection

### Getting Help
- **Undo**: Ctrl+Z fixes most mistakes
- **Reset View**: Use Fit View button if lost
- **Clear Selection**: Press Escape to deselect all

## Advanced Features

### Sticky Notes
- Add process documentation
- Explain business rules
- Provide context for decisions

### Shapes
- Highlight important areas
- Group related elements
- Add visual structure

### Grid & Alignment
- **Snap to Grid**: Toggle for precise positioning
- **Alignment Tools**: Align multiple selected elements
- **Distribution**: Evenly space selected elements

---

## Next Steps

1. **Try the Basics**: Create a simple 3-step process
2. **Add Decisions**: Include a gateway with multiple paths
3. **Document Everything**: Use descriptions and notes
4. **Share & Collaborate**: Export or invite team members
5. **Iterate**: Refine based on stakeholder feedback
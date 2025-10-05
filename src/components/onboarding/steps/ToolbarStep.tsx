import React from 'react';

export const ToolbarStep: React.FC = () => {
    return (
        <div className="onboarding-step">
            <h2>Creation Tools</h2>
            <p>
                Use the toolbar to add new elements to your world:
            </p>
            <ul>
                <li>🏰 <strong>Characters</strong> - People, creatures, NPCs</li>
                <li>🗺️ <strong>Locations</strong> - Places, buildings, regions</li>
                <li>📖 <strong>Story Elements</strong> - Plots, quests, events</li>
                <li>🎯 <strong>Items & Objects</strong> - Weapons, artifacts, treasures</li>
            </ul>
        </div>
    );
};
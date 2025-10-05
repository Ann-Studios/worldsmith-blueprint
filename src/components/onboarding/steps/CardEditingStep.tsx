import React from 'react';

export const CardEditingStep: React.FC = () => {
    return (
        <div className="onboarding-step">
            <h2>Editing Cards</h2>
            <p>
                Click on any card to edit its details. You can add descriptions, attributes,
                images, and connections to other cards.
            </p>
            <p>
                <strong>Pro Tip:</strong> Use the relationship lines to show how elements connect!
            </p>
        </div>
    );
};
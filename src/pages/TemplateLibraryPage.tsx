import { TemplateLibrary } from '@/components/Templates/TemplateLibrary';


// Template Library Page Component
const TemplateLibraryPage = () => {
    // Since this is a standalone page, users can browse templates first
    // and then choose which board to apply them to, or create a new board
    return (
        <div className="min-h-screen bg-gray-50">
            <TemplateLibrary
                boardId={undefined} // Let users select a board when applying
                onTemplateApplied={(templateId) => {
                    console.log(`Template ${templateId} applied successfully`);
                    // You could add a toast notification here
                }}
            />
        </div>
    );
};

export default TemplateLibraryPage;
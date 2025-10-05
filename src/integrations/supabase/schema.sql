-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET app.jwt_secret TO 'your-jwt-secret-here';

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_folder_id UUID REFERENCES public.boards(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    template_id UUID,
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}'
);

-- Board permissions table
CREATE TABLE IF NOT EXISTS public.board_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    granted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(board_id, user_id)
);

-- Cards table
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('note', 'character', 'location', 'plot', 'item')),
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    title TEXT,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Connections table
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    from_card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    to_card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    label TEXT,
    type TEXT NOT NULL CHECK (type IN ('relationship', 'dependency', 'timeline', 'custom')) DEFAULT 'relationship',
    color TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mentions TEXT[] DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    x INTEGER,
    y INTEGER,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE
);

-- Attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    content JSONB NOT NULL, -- Stores template structure (cards, connections, etc.)
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Search index for full-text search
CREATE TABLE IF NOT EXISTS public.search_index (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('card', 'connection', 'comment')),
    entity_id UUID NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Version history table
CREATE TABLE IF NOT EXISTS public.versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    description TEXT,
    snapshot JSONB NOT NULL, -- Complete board state
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time presence table for collaboration
CREATE TABLE IF NOT EXISTS public.presence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    cursor_x INTEGER,
    cursor_y INTEGER,
    current_card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, board_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON public.boards(created_by);
CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON public.boards(updated_at);
CREATE INDEX IF NOT EXISTS idx_cards_board_id ON public.cards(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_type ON public.cards(type);
CREATE INDEX IF NOT EXISTS idx_connections_board_id ON public.connections(board_id);
CREATE INDEX IF NOT EXISTS idx_connections_from_card ON public.connections(from_card_id);
CREATE INDEX IF NOT EXISTS idx_connections_to_card ON public.connections(to_card_id);
CREATE INDEX IF NOT EXISTS idx_comments_card_id ON public.comments(card_id);
CREATE INDEX IF NOT EXISTS idx_comments_board_id ON public.comments(board_id);
CREATE INDEX IF NOT EXISTS idx_attachments_card_id ON public.attachments(card_id);
CREATE INDEX IF NOT EXISTS idx_search_index_board_id ON public.search_index(board_id);
CREATE INDEX IF NOT EXISTS idx_search_index_content ON public.search_index USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_search_index_tags ON public.search_index USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_versions_board_id ON public.versions(board_id);
CREATE INDEX IF NOT EXISTS idx_presence_board_id ON public.presence(board_id);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON public.presence(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Boards policies
CREATE POLICY "Users can view boards they have access to" ON public.boards
    FOR SELECT USING (
        is_public = true 
        OR created_by = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.board_permissions 
            WHERE board_id = boards.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create boards" ON public.boards
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update boards they own" ON public.boards
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete boards they own" ON public.boards
    FOR DELETE USING (auth.uid() = created_by);

-- Board permissions policies
CREATE POLICY "Users can view permissions for boards they have access to" ON public.board_permissions
    FOR SELECT USING (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE created_by = auth.uid() 
            OR is_public = true
            OR EXISTS (
                SELECT 1 FROM public.board_permissions bp2
                WHERE bp2.board_id = boards.id AND bp2.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Board owners can manage permissions" ON public.board_permissions
    FOR ALL USING (
        board_id IN (
            SELECT id FROM public.boards WHERE created_by = auth.uid()
        )
    );

-- Cards policies
CREATE POLICY "Users can view cards from accessible boards" ON public.cards
    FOR SELECT USING (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE is_public = true 
            OR created_by = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.board_permissions 
                WHERE board_id = boards.id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Editors and owners can manage cards" ON public.cards
    FOR ALL USING (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE created_by = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.board_permissions 
                WHERE board_id = boards.id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'editor')
            )
        )
    );

-- Connections policies (similar to cards)
CREATE POLICY "Users can view connections from accessible boards" ON public.connections
    FOR SELECT USING (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE is_public = true 
            OR created_by = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.board_permissions 
                WHERE board_id = boards.id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Editors and owners can manage connections" ON public.connections
    FOR ALL USING (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE created_by = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.board_permissions 
                WHERE board_id = boards.id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'editor')
            )
        )
    );

-- Comments policies
CREATE POLICY "Users can view comments from accessible boards" ON public.comments
    FOR SELECT USING (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE is_public = true 
            OR created_by = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.board_permissions 
                WHERE board_id = boards.id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create comments on accessible boards" ON public.comments
    FOR INSERT WITH CHECK (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE is_public = true 
            OR created_by = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.board_permissions 
                WHERE board_id = boards.id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = created_by);

-- Templates policies
CREATE POLICY "Users can view public templates" ON public.templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their own templates" ON public.templates
    FOR ALL USING (auth.uid() = created_by);

-- Presence policies
CREATE POLICY "Users can view presence in accessible boards" ON public.presence
    FOR SELECT USING (
        board_id IN (
            SELECT id FROM public.boards 
            WHERE is_public = true 
            OR created_by = auth.uid() 
            OR EXISTS (
                SELECT 1 FROM public.board_permissions 
                WHERE board_id = boards.id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage their own presence" ON public.presence
    FOR ALL USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update search index
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete existing entries for this entity
    DELETE FROM public.search_index 
    WHERE entity_type = TG_ARGV[0] AND entity_id = NEW.id;
    
    -- Insert new search entry
    INSERT INTO public.search_index (board_id, entity_type, entity_id, content, tags)
    VALUES (
        NEW.board_id,
        TG_ARGV[0],
        NEW.id,
        COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''),
        COALESCE(NEW.tags, '{}')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for search index
CREATE TRIGGER update_card_search_index AFTER INSERT OR UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_search_index('card');

CREATE TRIGGER update_comment_search_index AFTER INSERT OR UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_search_index('comment');

-- Function to create version snapshot
CREATE OR REPLACE FUNCTION create_version_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    current_version INTEGER;
    board_snapshot JSONB;
BEGIN
    -- Get current version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO current_version 
    FROM public.versions 
    WHERE board_id = NEW.id;
    
    -- Create snapshot of board state
    SELECT jsonb_build_object(
        'board', row_to_json(NEW),
        'cards', (SELECT jsonb_agg(row_to_json(c)) FROM public.cards c WHERE c.board_id = NEW.id),
        'connections', (SELECT jsonb_agg(row_to_json(conn)) FROM public.connections conn WHERE conn.board_id = NEW.id),
        'comments', (SELECT jsonb_agg(row_to_json(com)) FROM public.comments com WHERE com.board_id = NEW.id)
    ) INTO board_snapshot;
    
    -- Insert version record
    INSERT INTO public.versions (board_id, version_number, description, snapshot, created_by)
    VALUES (NEW.id, current_version, 'Auto-saved version', board_snapshot, NEW.created_by);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for versioning (runs on board update)
CREATE TRIGGER create_board_version AFTER UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION create_version_snapshot();
// pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import worldsmithLogo from '@/assets/worldsmith-logo.png';
import {
    Users,
    Zap,
    Globe,
    Gamepad2,
    ArrowRight,
    Star,
    CheckCircle,
    Sparkles,
    Layers,
    Target,
    BookOpen
} from 'lucide-react';

export const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-gray-100 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
                            <img src={worldsmithLogo} alt="WorldSmith Logo" className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-brand font-bold  ">
                            worldsmith
                        </span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" asChild className="font-body">
                            <Link to="/login">Sign In</Link>
                        </Button>
                        <Button asChild className="bg-brand-green hover:bg-brand-green/90   font-body font-medium">
                            <Link to="/login">Get Started</Link>
                        </Button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-24 px-4 bg-gradient-to-br">
                <div className="container mx-auto text-center max-w-5xl">
                    <Badge className="mb-6 bg-brand-green   border-0 font-body">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Now in Beta
                    </Badge>
                    <h1 className="text-6xl md:text-7xl font-brand font-bold mb-8   leading-tight">
                        Build Worlds,<br />
                        <span className="text-brand-teal">Tell Stories</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto font-body leading-relaxed">
                        The ultimate visual canvas for worldbuilding, novel planning, and game design.
                        Organize your creative projects with drag-and-drop cards and bring your stories to life.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button size="lg" asChild className="text-lg px-10 py-6 bg-brand-green hover:bg-brand-green/90   font-body font-semibold">
                            <Link to="/login">
                                Start Creating
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white font-body">
                            Watch Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4">
                <div className="container mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-brand font-bold mb-6  ">
                            Everything you need to build amazing worlds
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
                            Powerful tools designed for creators, writers, and game developers
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-brand-green/20">
                            <CardHeader className="pb-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                                    <Layers className="w-7 h-7 text-brand-teal" />
                                </div>
                                <CardTitle className="font-brand text-xl  ">Visual Canvas</CardTitle>
                                <CardDescription className="font-body text-gray-600 leading-relaxed">
                                    Drag and drop cards to organize your world, characters, and plot points
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-brand-green/20">
                            <CardHeader className="pb-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                                    <Users className="w-7 h-7 text-brand-teal" />
                                </div>
                                <CardTitle className="font-brand text-xl  ">Collaborative</CardTitle>
                                <CardDescription className="font-body text-gray-600 leading-relaxed">
                                    Work together with your team in real-time on shared projects
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-brand-green/20">
                            <CardHeader className="pb-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                                    <Zap className="w-7 h-7 text-brand-teal" />
                                </div>
                                <CardTitle className="font-brand text-xl  ">Lightning Fast</CardTitle>
                                <CardDescription className="font-body text-gray-600 leading-relaxed">
                                    Built for speed with instant updates and smooth interactions
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-brand-green/20">
                            <CardHeader className="pb-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                                    <BookOpen className="w-7 h-7 text-brand-teal" />
                                </div>
                                <CardTitle className="font-brand text-xl  ">Story Templates</CardTitle>
                                <CardDescription className="font-body text-gray-600 leading-relaxed">
                                    Pre-built templates for novels, games, and worldbuilding projects
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-brand-green/20">
                            <CardHeader className="pb-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                                    <Globe className="w-7 h-7 text-brand-teal" />
                                </div>
                                <CardTitle className="font-brand text-xl  ">World Building</CardTitle>
                                <CardDescription className="font-body text-gray-600 leading-relaxed">
                                    Create detailed maps, cultures, and histories for your worlds
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-brand-green/20">
                            <CardHeader className="pb-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
                                    <Gamepad2 className="w-7 h-7 text-brand-teal" />
                                </div>
                                <CardTitle className="font-brand text-xl">Game Design</CardTitle>
                                <CardDescription className="font-body text-gray-600 leading-relaxed">
                                    Perfect for RPG campaigns, game mechanics, and character sheets
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="py-24 px-">
                <div className="container mx-auto ">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-brand font-bold mb-6">
                            Perfect for every creator
                        </h2>
                        <p className="text-xl text-gray-600 font-body">
                            Whether you're writing a novel or designing a game, WorldSmith has you covered
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h3 className="text-3xl font-brand font-bold mb-8  ">Writers & Authors</h3>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="w-6 h-6 text-brand-green mt-1 flex-shrink-0" />
                                    <p className="font-body text-gray-700 text-lg">Organize plot points, character arcs, and world details</p>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="w-6 h-6 text-brand-green mt-1 flex-shrink-0" />
                                    <p className="font-body text-gray-700 text-lg">Track story timelines and character relationships</p>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="w-6 h-6 text-brand-green mt-1 flex-shrink-0" />
                                    <p className="font-body text-gray-700 text-lg">Collaborate with editors and beta readers</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-brand font-bold mb-8  ">Game Developers</h3>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="w-6 h-6 text-brand-green mt-1 flex-shrink-0" />
                                    <p className="font-body text-gray-700 text-lg">Design game mechanics and balance systems</p>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="w-6 h-6 text-brand-green mt-1 flex-shrink-0" />
                                    <p className="font-body text-gray-700 text-lg">Create detailed character sheets and NPCs</p>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="w-6 h-6 text-brand-green mt-1 flex-shrink-0" />
                                    <p className="font-body text-gray-700 text-lg">Plan quests, dungeons, and world lore</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-brand-dark-green">
                <div className="container mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-brand font-bold text-white mb-6">
                        Ready to start building?
                    </h2>
                    <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto font-body">
                        Join thousands of creators who are already using WorldSmith to bring their ideas to life
                    </p>
                    <Button size="lg" asChild className="text-lg px-12 py-6 bg-brand-green hover:bg-brand-green/90   font-body font-semibold">
                        <Link to="/login">
                            Get Started Free
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-4 bg-brand-black text-white">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-3 mb-6 md:mb-0">
                            <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
                                <img src={worldsmithLogo} alt="WorldSmith Logo" className="w-6 h-6" />

                            </div>
                            <span className="text-2xl font-brand font-bold">worldsmith</span>
                        </div>
                        <div className="text-gray-400 font-body">
                            © 2024 WorldSmith. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

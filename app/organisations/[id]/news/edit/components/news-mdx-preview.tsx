'use client';

import { useEffect, useState } from 'react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';

interface NewsMDXProps {
    contentPath?: string;
    content?: string;
}

export default function NewsMDX({ contentPath, content }: NewsMDXProps) {
    const [MDXContent, setMDXContent] = useState<React.ComponentType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        async function loadMDX() {
            try {
                setIsLoading(true);
                let mdxSource: string;

                if (content !== undefined) {
                    mdxSource = content;
                } else if (contentPath) {
                    const contentUrl = contentPath.startsWith('http')
                        ? contentPath
                        : `https://cdn.studentcouncil.dk/${contentPath.replace(/^\/+/, '')}`;

                    const response = await fetch(contentUrl);
                    if (!response.ok) {
                        throw new Error('Failed to fetch MDX content');
                    }
                    mdxSource = await response.text();
                } else {
                    setIsLoading(false);
                    return;
                }

                const { default: Content } = await evaluate(mdxSource, {
                    ...runtime,
                    development: false
                });

                setMDXContent(() => Content);
                setError(null);
            } catch (err) {
                console.error('Error loading MDX:', err);
                setError('Failed to load content');
            } finally {
                setIsLoading(false);
            }
        }

        loadMDX();
    }, [contentPath, content, mounted]);

    if (!mounted) {
        return null;
    }

    if (isLoading) {
        return <div className="text-muted-foreground">Loading content...</div>;
    }

    if (error) {
        return <div className="text-destructive">{error}</div>;
    }

    if (!MDXContent) {
        return null;
    }

    const baseStyles = "prose prose-slate dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_p+ul]:mt-0 [&_p+ol]:mt-0 [&_p]:my-4 [&_p]:leading-7 [&_p:has(+ul)]:mb-0 [&_p:has(+ol)]:mb-0 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_img]:rounded-lg [&_img]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4";

    return (
        <div className={baseStyles}>
            <MDXContent />
        </div>
    );
}
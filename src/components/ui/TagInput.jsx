import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Tag Input Component
 * Skills chip input with add/remove functionality
 */
export default function TagInput({
    tags = [],
    onChange,
    placeholder = 'Add skill...',
    maxTags = 10,
    className = ''
}) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            if (tags.length < maxTags && !tags.includes(inputValue.trim())) {
                onChange([...tags, inputValue.trim()]);
                setInputValue('');
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div
            className={`glass-input min-h-[56px] h-auto rounded-xl p-2 flex flex-wrap gap-2 items-center cursor-text ${className}`}
            onClick={() => inputRef.current?.focus()}
        >
            <AnimatePresence>
                {tags.map((tag) => (
                    <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="skill-chip"
                    >
                        {tag}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 h-8 min-w-[120px] flex-1 outline-none"
            />
        </div>
    );
}

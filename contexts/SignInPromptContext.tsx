import React, { createContext, useState, useContext } from 'react';

interface SignInPromptContextType {
    showPrompt: boolean;
    triggerSignInPrompt: () => void;
    hidePrompt: () => void;
}

const SignInPromptContext = createContext<SignInPromptContextType>({
    showPrompt: false,
    triggerSignInPrompt: () => { },
    hidePrompt: () => { },
});

export const SignInPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [showPrompt, setShowPrompt] = useState(false);

    const triggerSignInPrompt = () => {
        setShowPrompt(true);
        setTimeout(() => setShowPrompt(false), 4000);
    };

    const hidePrompt = () => setShowPrompt(false);

    return (
        <SignInPromptContext.Provider value={{ showPrompt, triggerSignInPrompt, hidePrompt }}>
            {children}
        </SignInPromptContext.Provider>
    );
};

export const useSignInPrompt = () => useContext(SignInPromptContext);

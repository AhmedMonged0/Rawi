import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '../components/ui/Modal';

const ModalContext = createContext();

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'confirm', // 'confirm' or 'prompt'
        title: '',
        message: '',
        onConfirm: () => { },
        inputValue: '',
        placeholder: ''
    });

    const [inputVal, setInputVal] = useState('');

    const showConfirm = useCallback((title, message, onConfirm) => {
        setModalState({
            isOpen: true,
            type: 'confirm',
            title,
            message,
            onConfirm: () => {
                onConfirm();
                closeModal();
            }
        });
    }, []);

    const showPrompt = useCallback((title, message, onConfirm, placeholder = '') => {
        setInputVal('');
        setModalState({
            isOpen: true,
            type: 'prompt',
            title,
            message,
            placeholder,
            onConfirm: (value) => {
                onConfirm(value);
                closeModal();
            }
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
        setInputVal('');
    }, []);

    const handleConfirm = () => {
        if (modalState.type === 'prompt') {
            modalState.onConfirm(inputVal);
        } else {
            modalState.onConfirm();
        }
    };

    return (
        <ModalContext.Provider value={{ showConfirm, showPrompt }}>
            {children}
            <Modal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        >
                            تأكيد
                        </button>
                    </>
                }
            >
                <p className="mb-4">{modalState.message}</p>
                {modalState.type === 'prompt' && (
                    <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder={modalState.placeholder}
                        className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        autoFocus
                    />
                )}
            </Modal>
        </ModalContext.Provider>
    );
};

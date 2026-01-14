
import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download, Smartphone, CheckCircle } from 'lucide-react';

interface InstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
  installPrompt: any; // O evento beforeinstallprompt
}

const InstallGuide: React.FC<InstallGuideProps> = ({ isOpen, onClose, installPrompt }) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar se é iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Detectar se já está instalado (Standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário aceitou a instalação');
        }
        onClose();
      });
    } else {
        alert("Para instalar, procure a opção 'Adicionar à Tela Inicial' ou 'Instalar Aplicativo' no menu do seu navegador.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
        >
          <X size={20} />
        </button>

        <div className="p-8 pb-6 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            {isStandalone ? <CheckCircle size={32} /> : <Smartphone size={32} />}
          </div>
          
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {isStandalone ? 'Aplicativo Instalado!' : 'Instalar Aplicativo'}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isStandalone 
              ? 'Você já está usando a versão aplicativo do FinControl AI.' 
              : 'Adicione o FinControl AI à sua tela inicial para um acesso mais rápido e experiência em tela cheia.'}
          </p>
        </div>

        {!isStandalone && (
            <div className="p-6 bg-gray-50 border-t border-gray-100">
            {isIOS ? (
                <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500">
                        <Share size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">1. Toque em Compartilhar</p>
                        <p className="text-xs text-gray-400">Na barra inferior do Safari</p>
                    </div>
                </div>
                <div className="h-px bg-gray-200 ml-12"></div>
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-gray-600">
                        <PlusSquare size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">2. Adicionar à Tela de Início</p>
                        <p className="text-xs text-gray-400">Role para baixo nas opções</p>
                    </div>
                </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {installPrompt ? (
                        <button 
                            onClick={handleInstallClick}
                            className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            INSTALAR AGORA
                        </button>
                    ) : (
                        <div className="text-center text-sm text-gray-500">
                            <p className="mb-2">Abra o menu do seu navegador (três pontinhos) e selecione:</p>
                            <span className="font-bold text-gray-700 bg-white px-3 py-1 rounded border border-gray-200 inline-block">
                                Instalar aplicativo
                            </span>
                            <p className="mt-2 text-xs">Ou "Adicionar à tela inicial"</p>
                        </div>
                    )}
                </div>
            )}
            </div>
        )}
        
        {isStandalone && (
             <div className="p-6 bg-gray-50 border-t border-gray-100">
                 <button 
                    onClick={onClose}
                    className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
                >
                    Entendido
                </button>
             </div>
        )}
      </div>
    </div>
  );
};

export default InstallGuide;

import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Acesso Restrito</h2>
            <p className="text-slate-400 text-center mb-6">Por favor, faça login para gerenciar o torneio.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-300">Usuário</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">Senha</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:scale-105"
                >
                    Entrar
                </button>
            </form>
        </div>
    </div>
  );
};

export default Login;

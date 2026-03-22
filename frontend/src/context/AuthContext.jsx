import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUser(JSON.parse(storedUser));
            // Set token in axios headers
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await API.post('/auth/login', { email, password });
            
            // Extract token and user data from response
            const { token, ...userData } = data;
            
            // Save token and user separately
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Set token in axios headers for future requests
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(userData);
            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await API.post('/auth/register', userData);
            
            // Extract token and user data from response
            const { token, ...userDataResponse } = data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userDataResponse));
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(userDataResponse);
            return userDataResponse;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete API.defaults.headers.common['Authorization'];
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout, updateUser }}
        >
            {children}
        </AuthContext.Provider>
    );
};
import { useAuth } from '../context/AuthContext';

const SimpleChat = () => {
    const { user } = useAuth();
    
    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <div className="container mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-blue-600 mb-4">
                        Chat Page is Working!
                    </h1>
                    <p className="text-gray-600 mb-2">
                        Logged in as: <strong>{user?.fullName || 'User'}</strong>
                    </p>
                    <p className="text-gray-500 text-sm">
                        User ID: {user?._id}
                    </p>
                    <p className="text-green-500 mt-4">
                        ✅ Backend is connected on port 5000
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SimpleChat;
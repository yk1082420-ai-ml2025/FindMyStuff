import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Trophy, TrendingUp, Award, Search, RefreshCw } from 'lucide-react';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('monthly'); // 'monthly' or 'allTime'
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, [filter]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = filter === 'monthly' ? '/leaderboard/current' : '/leaderboard/alltime';
            const { data } = await API.get(endpoint);
            setUsers(data.data || []);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
            setError('Unable to load leaderboard. Please try again later.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchLeaderboard();
        setRefreshing(false);
    };

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(search.toLowerCase())
    );

    // Helper to get rank icon/display
    const getRankDisplay = (rank) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return <span className="text-gray-600 font-medium">#{rank}</span>;
    };

    return (
        <div className="min-h-screen bg-surface pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                        🏆 Leaderboard
                    </h1>
                    <p className="text-gray-500 mt-2">Top helpers this month</p>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('monthly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === 'monthly'
                                    ? 'bg-primary-500 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4 inline mr-1" />
                            Monthly Points
                        </button>
                        <button
                            onClick={() => setFilter('allTime')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === 'allTime'
                                    ? 'bg-primary-500 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <Trophy className="w-4 h-4 inline mr-1" />
                            All Time
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 text-gray-400 hover:text-primary-600 rounded-lg transition-all disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Leaderboard Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200/60 p-12 text-center">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400">No users found</p>
                        {search && <p className="text-sm text-gray-300 mt-1">Try a different search term</p>}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {filter === 'monthly' ? 'Monthly Points' : 'Total Points'}
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Returns</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getRankDisplay(user.rank)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-left">
                                                <div className="flex items-center gap-3">
                                                    {user.profilePhoto ? (
                                                        <img
                                                            src={user.profilePhoto}
                                                            alt={user.fullName}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                                                            {user.fullName?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-gray-800">{user.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-primary-600">
                                                {filter === 'monthly' ? user.monthlyPoints : user.points}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                                                {user.successfulReturns || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer note */}
                <div className="mt-6 text-center text-xs text-gray-400">
                    Leaderboard updates in real time. Points are awarded automatically after successful returns.
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
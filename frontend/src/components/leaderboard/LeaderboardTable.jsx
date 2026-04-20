import React, { useEffect, useState } from 'react';
import { leaderboardAPI } from '../../services/leaderboardAPI';
import RankIcon from './RankIcon';
import PointsBadge from './PointsBadge';

const LeaderboardTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await leaderboardAPI.getCurrentLeaderboard();
      setUsers(res.data.data); // expects array of { rank, fullName, faculty, monthlyPoints, ... }
    } catch (error) {
      console.error('Failed to load leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center">Loading leaderboard...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Rank</th>
            <th className="px-4 py-2">Student</th>
            <th className="px-4 py-2">Faculty</th>
            <th className="px-4 py-2">Points (This Month)</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-t">
              <td className="px-4 py-2 text-center">
                <RankIcon rank={user.rank} />
              </td>
              <td className="px-4 py-2">{user.fullName}</td>
              <td className="px-4 py-2">{user.faculty}</td>
              <td className="px-4 py-2">
                <PointsBadge points={user.monthlyPoints} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
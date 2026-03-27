// frontend/src/components/Dashboard.jsx

import React, { useState } from 'react';
import { Flag, MessageCircle, FileText, Home, User, Bell } from 'lucide-react'; // Add Flag icon
import MyReports from './MyReports'; // Import MyReports component
// Your other imports...

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('claims'); // or your default tab
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(null);
  // Your other state variables...

  // Your existing code...

  return (
    <div className="dashboard-container">
      {/* Your existing header and sidebar */}
      
      {/* Tab Navigation - Add Reports tab here */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'claims' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Claims..
        </button>
        
        <button
          onClick={() => setActiveTab('lost-found')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'lost-found' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lost & Found
        </button>
        
        <button
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'notices' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Notices
        </button>
        
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'messages' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-1" />
          Messages
        </button>
        
        {/* NEW REPORTS TAB - Add this */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-1 ${
            activeTab === 'reports' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Flag className="w-4 h-4" />
          Reports
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Claims Tab Content */}
        {activeTab === 'claims' && (
          <div>
            {/* Your existing claims content */}
          </div>
        )}

        {/* Lost & Found Tab Content */}
        {activeTab === 'lost-found' && (
          <div>
            {/* Your existing lost & found content */}
          </div>
        )}

        {/* Notices Tab Content */}
        {activeTab === 'notices' && (
          <div>
            {/* Your existing notices content */}
          </div>
        )}

        {/* Messages Tab Content */}
        {activeTab === 'messages' && (
          <div>
            {/* Your existing messages content */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-surface-dark">Messages</h1>
              <p className="text-gray-500 text-sm mt-1">Chats opened after claim approval</p>
            </div>
            <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm flex h-[60vh]">
              {/* Your existing chat components */}
            </div>
          </div>
        )}

        {/* REPORTS TAB CONTENT - Add this */}
        {activeTab === 'reports' && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-surface-dark flex items-center gap-2">
                    <Flag className="w-6 h-6 text-primary-600" />
                    My Reports
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Track and manage your reported content
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
              <MyReports />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
import ChatBox from '../components/ChatBox';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Global Chat</h1>
      <p className="text-sm text-gray-500 mb-6">Chat with everyone on the platform</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <ChatBox maxHeight="500px" />
      </div>
    </div>
  );
}

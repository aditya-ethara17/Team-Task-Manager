import { useState, useEffect } from 'react';
import { timesheets } from '../api/client';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timesheets() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchTimesheet = async () => {
    setLoading(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + weekOffset * 7);
      const params = { week: d.toISOString().split('T')[0] };
      const { data: res } = await timesheets.getMy(params);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimesheet(); }, [weekOffset]);

  const navigateWeek = (dir) => setWeekOffset(prev => prev + dir);

  const isCurrentWeek = weekOffset === 0;

  if (loading && !data) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Timesheet</h1>
        <div className="flex items-center space-x-3">
          <button onClick={() => setWeekOffset(0)} className={`text-sm font-medium px-3 py-1.5 rounded-lg ${isCurrentWeek ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            This Week
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigateWeek(-1)} className="text-indigo-600 text-sm hover:underline">&larr; Previous</button>
        <h2 className="text-lg font-semibold text-gray-700">
          {data?.weekStart} — {data?.weekEnd}
        </h2>
        <button onClick={() => navigateWeek(1)} className="text-indigo-600 text-sm hover:underline">Next &rarr;</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-px bg-gray-200">
          <div className="col-span-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">Day</div>
          <div className="col-span-6 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">Entries</div>
          <div className="col-span-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 text-right">Hours</div>

          {data?.daily.map(day => (
            <div key={day.dayName} className="col-span-12 grid grid-cols-12 gap-px">
              <div className="col-span-3 px-4 py-3 bg-white">
                <p className="text-sm font-medium text-gray-700">{day.dayName}</p>
                <p className="text-xs text-gray-400">{day.date}</p>
              </div>
              <div className="col-span-6 px-4 py-3 bg-white">
                {day.entries.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No entries</p>
                ) : (
                  <div className="space-y-1">
                    {day.entries.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-sm text-gray-700 truncate">{entry.task?.title || 'Unknown'}</span>
                          <span className="text-xs text-gray-400 truncate">{entry.task?.project?.name}</span>
                        </div>
                        {entry.description && <span className="text-xs text-gray-400 ml-2 truncate">{entry.description}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-3 px-4 py-3 bg-white text-right">
                <span className="text-sm font-medium text-indigo-600">{day.total > 0 ? `${day.total}h` : '-'}</span>
              </div>
            </div>
          ))}

          <div className="col-span-12 grid grid-cols-12 gap-px bg-gray-200 border-t-2 border-indigo-200">
            <div className="col-span-9 px-4 py-3 bg-indigo-50">
              <span className="text-sm font-bold text-gray-800">Weekly Total</span>
            </div>
            <div className="col-span-3 px-4 py-3 bg-indigo-50 text-right">
              <span className="text-sm font-bold text-indigo-700">{data?.weeklyTotal || 0}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

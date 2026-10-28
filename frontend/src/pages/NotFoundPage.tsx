import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-2xl mb-4">
        404
      </div>
      <h3 className="text-xl font-bold text-slate-900">Page Not Found</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
        The requested warehouse navigation route does not exist or has been relocated.
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/')}
          leftIcon={<LayoutDashboard className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

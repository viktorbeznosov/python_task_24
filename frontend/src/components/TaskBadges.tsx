import { Task } from '../api';
import { getStatusBadgeClasses, getPriorityBadgeClasses, STATUS_LABELS, PRIORITY_LABELS } from '../utils/taskUtils';

interface TaskBadgesProps {
  status: Task['status'];
  priority: Task['priority'];
}

export const TaskBadges = ({ status, priority }: TaskBadgesProps) => (
  <div className="flex gap-2">
    <span className={getStatusBadgeClasses(status)}>{STATUS_LABELS[status]}</span>
    <span className={getPriorityBadgeClasses(priority)}>{PRIORITY_LABELS[priority]}</span>
  </div>
);
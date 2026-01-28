export interface TemplateQuestion {
  title: string;
  type: 'SHORT_TEXT' | 'PARAGRAPH' | 'MULTIPLE_CHOICE' | 'CHECKBOXES' | 'DROPDOWN' | 'DATE' | 'TIME' | 'VIDEO' | 'IMAGE';
  description?: string;
  required?: boolean;
  options?: string[];
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: 'Personal' | 'Work' | 'Education' | 'Recent';
  icon: string;
  backgroundImage?: string;
  questions: TemplateQuestion[];
}

export const TEMPLATES: Template[] = [
  // Personal
  {
    id: 'contact-info',
    title: 'Contact Information',
    description: 'Get in touch with your audience',
    category: 'Personal',
    icon: 'User',
    backgroundImage: '/template-backgrounds/contact-info.jpg',
    questions: [
      { title: 'Name', type: 'SHORT_TEXT', required: true },
      { title: 'Email', type: 'SHORT_TEXT', required: true },
      { title: 'Address', type: 'PARAGRAPH' },
      { title: 'Phone number', type: 'SHORT_TEXT' },
      { title: 'Comments', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'find-a-time',
    title: 'Find a Time',
    description: 'Schedule meetings easily',
    category: 'Personal',
    icon: 'Calendar',
    backgroundImage: '/template-backgrounds/find-a-time.jpg',
    questions: [
      { title: 'What is this meeting about?', type: 'SHORT_TEXT', required: true },
      { title: 'Which days are you available?', type: 'CHECKBOXES', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      { title: 'What hours work best for you?', type: 'SHORT_TEXT' },
    ]
  },
  {
    id: 'rsvp',
    title: 'RSVP',
    description: 'Track event attendance',
    category: 'Personal',
    icon: 'CheckSquare',
    backgroundImage: '/template-backgrounds/rsvp.jpg',
    questions: [
      { title: 'Can you attend?', type: 'MULTIPLE_CHOICE', options: ['Yes, I\'ll be there', 'Sorry, I can\'t make it'], required: true },
      { title: 'What is your name?', type: 'SHORT_TEXT', required: true },
      { title: 'Any comments or dietary requirements?', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'party-invite',
    title: 'Party Invite',
    description: 'Invite friends to your party',
    category: 'Personal',
    icon: 'Music',
    backgroundImage: '/template-backgrounds/party-invite.jpg',
    questions: [
      { title: 'What is your name?', type: 'SHORT_TEXT', required: true },
      { title: 'Can you make it?', type: 'MULTIPLE_CHOICE', options: ['Yes!', 'Maybe', 'No'], required: true },
      { title: 'How many people are coming with you?', type: 'SHORT_TEXT' },
      { title: 'What are you bringing?', type: 'CHECKBOXES', options: ['Appetizer', 'Main dish', 'Dessert', 'Drinks', 'Other'] },
    ]
  },
  {
    id: 't-shirt-signup',
    title: 'T-Shirt Sign Up',
    description: 'Collect shirt sizes',
    category: 'Personal',
    icon: 'Shirt',
    backgroundImage: '/template-backgrounds/t-shirt-signup.jpg',
    questions: [
      { title: 'Full Name', type: 'SHORT_TEXT', required: true },
      { title: 'Shirt Size', type: 'DROPDOWN', options: ['Small', 'Medium', 'Large', 'Extra Large'], required: true },
      { title: 'Any other details', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'event-registration',
    title: 'Event Registration',
    description: 'Sign up for upcoming events',
    category: 'Personal',
    icon: 'Ticket',
    backgroundImage: '/template-backgrounds/event-registration.jpg',
    questions: [
      { title: 'Name', type: 'SHORT_TEXT', required: true },
      { title: 'Email Address', type: 'SHORT_TEXT', required: true },
      { title: 'Organization', type: 'SHORT_TEXT' },
      { title: 'Dietary Restrictions', type: 'PARAGRAPH' },
    ]
  },

  // Work
  {
    id: 'event-feedback',
    title: 'Event Feedback',
    description: 'Hear from your attendees',
    category: 'Work',
    icon: 'MessageSquare',
    backgroundImage: '/template-backgrounds/event-feedback.jpg',
    questions: [
      { title: 'How satisfied were you with the event?', type: 'MULTIPLE_CHOICE', options: ['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'], required: true },
      { title: 'What was the best part of the event?', type: 'PARAGRAPH' },
      { title: 'How can we improve for next time?', type: 'PARAGRAPH' },
      { title: 'Would you recommend this event to others?', type: 'MULTIPLE_CHOICE', options: ['Yes', 'No'] },
    ]
  },
  {
    id: 'order-form',
    title: 'Order Form',
    description: 'Process product orders',
    category: 'Work',
    icon: 'ShoppingCart',
    backgroundImage: '/template-backgrounds/order-form.jpg',
    questions: [
      { title: 'Contact Person Name', type: 'SHORT_TEXT', required: true },
      { title: 'Items Requested', type: 'PARAGRAPH', required: true },
      { title: 'Quantity Required', type: 'SHORT_TEXT' },
      { title: 'Shipping Address', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'job-application',
    title: 'Job Application',
    description: 'Hire your next teammate',
    category: 'Work',
    icon: 'Briefcase',
    backgroundImage: '/template-backgrounds/job-application.jpg',
    questions: [
      { title: 'Full Name', type: 'SHORT_TEXT', required: true },
      { title: 'Email', type: 'SHORT_TEXT', required: true },
      { title: 'Phone Number', type: 'SHORT_TEXT', required: true },
      { title: 'Which position are you applying for?', type: 'DROPDOWN', options: ['Software Engineer', 'Product Designer', 'Marketing Lead', 'Sales Executive'] },
      { title: 'Cover Letter', type: 'PARAGRAPH' },
      { title: 'Portfolio Link', type: 'SHORT_TEXT' },
    ]
  },
  {
    id: 'time-off-request',
    title: 'Time Off Request',
    description: 'Manage leave requests',
    category: 'Work',
    icon: 'Coffee',
    backgroundImage: '/template-backgrounds/time-off-request.jpg',
    questions: [
      { title: 'Employee Name', type: 'SHORT_TEXT', required: true },
      { title: 'Type of Leave', type: 'MULTIPLE_CHOICE', options: ['Vacation', 'Sick Leave', 'Personal', 'Maternity/Paternity'] },
      { title: 'Start Date', type: 'DATE', required: true },
      { title: 'End Date', type: 'DATE', required: true },
      { title: 'Reason for request', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'work-request',
    title: 'Work Request',
    description: 'Handle internal requests',
    category: 'Work',
    icon: 'Clipboard',
    backgroundImage: '/template-backgrounds/work-request.jpg',
    questions: [
      { title: 'Project Title', type: 'SHORT_TEXT', required: true },
      { title: 'Detailed Description', type: 'PARAGRAPH', required: true },
      { title: 'Priority level', type: 'MULTIPLE_CHOICE', options: ['Low', 'Medium', 'High', 'Urgent'] },
      { title: 'Desired Deadline', type: 'DATE' },
    ]
  },
  {
    id: 'customer-feedback',
    title: 'Customer Feedback',
    description: 'Understand customer needs',
    category: 'Work',
    icon: 'ThumbsUp',
    backgroundImage: '/template-backgrounds/customer-feedback.jpg',
    questions: [
      { title: 'Overall Satisfaction', type: 'MULTIPLE_CHOICE', options: ['Excellent', 'Good', 'Average', 'Poor'] },
      { title: 'What could we do better?', type: 'PARAGRAPH' },
      { title: 'Can we contact you about your feedback?', type: 'MULTIPLE_CHOICE', options: ['Yes', 'No'] },
    ]
  },

  // Education
  {
    id: 'blank-quiz',
    title: 'Blank Quiz',
    description: 'Start a new assessment',
    category: 'Education',
    icon: 'Zap',
    backgroundImage: '/template-backgrounds/blank-quiz.jpg',
    questions: []
  },
  {
    id: 'exit-ticket',
    title: 'Exit Ticket',
    description: 'Quick learning check',
    category: 'Education',
    icon: 'DoorOpen',
    backgroundImage: '/template-backgrounds/exit-ticket.jpg',
    questions: [
      { title: 'Name', type: 'SHORT_TEXT' },
      { title: 'What is one thing you learned today?', type: 'PARAGRAPH', required: true },
      { title: 'What was the most challenging part of the lesson?', type: 'PARAGRAPH' },
      { title: 'Do you have any questions?', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'assessment',
    title: 'Assessment',
    description: 'Detailed evaluation',
    category: 'Education',
    icon: 'Target',
    backgroundImage: '/template-backgrounds/assessment.jpg',
    questions: [
      { title: 'Learning Goal', type: 'SHORT_TEXT', required: true },
      { title: 'Current Progress', type: 'MULTIPLE_CHOICE', options: ['Not started', 'In progress', 'Completed'] },
      { title: 'What feedback do you have?', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'worksheet',
    title: 'Worksheet',
    description: 'Standard classroom activity',
    category: 'Education',
    icon: 'BookOpen',
    backgroundImage: '/template-backgrounds/worksheet.jpg',
    questions: [
      { title: 'Question 1', type: 'PARAGRAPH' },
      { title: 'Question 2', type: 'PARAGRAPH' },
      { title: 'Question 3', type: 'PARAGRAPH' },
    ]
  },
  {
    id: 'course-evaluation',
    title: 'Course Evaluation',
    description: 'Improve your curriculum',
    category: 'Education',
    icon: 'BarChart',
    backgroundImage: '/template-backgrounds/course-evaluation.jpg',
    questions: [
      { title: 'Course Rating', type: 'MULTIPLE_CHOICE', options: ['5 - Excellent', '4', '3', '2', '1 - Poor'], required: true },
      { title: 'What did you like most about the course?', type: 'PARAGRAPH' },
      { title: 'How would you rate the instructor?', type: 'MULTIPLE_CHOICE', options: ['Outstanding', 'Good', 'Adequate', 'Needs improvement'] },
    ]
  }
];

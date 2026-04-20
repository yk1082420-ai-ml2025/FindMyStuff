const FACULTIES = ['IT', 'Engineering', 'Business', 'Medicine', 'Science', 'Arts'];

const FacultyFilter = ({ selectedFaculty, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect('')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          selectedFaculty === '' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        All Faculties
      </button>
      {FACULTIES.map((fac) => (
        <button
          key={fac}
          onClick={() => onSelect(fac)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedFaculty === fac 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {fac}
        </button>
      ))}
    </div>
  );
};
export default FacultyFilter;
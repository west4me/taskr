import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, X, FolderPlus } from 'lucide-react';
import useAuth from '../../contexts/AuthContext/useAuth';
import { getUserProjects, addProject } from '../../services/projectService';

const ProjectSelect = ({ value = [], onChange }) => {
  const [projects, setProjects] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const userProjects = await getUserProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, [user.uid]);

  const handleAddProject = async () => {
    if (!inputValue.trim()) return;

    try {
      const projectName = inputValue.trim();
      // Check if project already exists (exact name match)
      const existingProject = projects.find(
        (p) => p.name.toLowerCase() === projectName.toLowerCase()
      );

      if (existingProject) {
        handleSelectProject(existingProject);
        return;
      }

      const newProject = await addProject(user.uid, projectName);
      setProjects((prev) => [...prev, newProject]);
      handleSelectProject(newProject);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleSelectProject = (project) => {
    if (!value?.find((p) => p.id === project.id)) {
      onChange([...value, project]);
    }
    setInputValue('');
  };

  const handleRemoveProject = (projectId) => {
    onChange(value.filter((p) => p.id !== projectId));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddProject();
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !value.find((p) => p.id === project.id)
  );

  return (
    <div className="space-y-2">
      {/* Selected projects (chips) */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((project) => (
          <span
            key={project.id}
            className="px-3 py-1.5 text-xs rounded-full 
        bg-[var(--color-primary)]/10 
        text-[var(--color-primary)]
        border border-[var(--color-primary)]/20
        flex items-center gap-1.5"
          >
            <FolderPlus className="w-3 h-3" />
            {project.name}
            <button
              onClick={() => handleRemoveProject(project.id)}
              className="ml-1 p-0.5 hover:bg-[var(--color-primary)]/20 rounded-full
          transition-colors"
              type="button"
              aria-label="Remove project"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input + autocomplete dropdown */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type to search or create project..."
          className="
            w-full rounded-lg px-4 py-2
            bg-[var(--color-surface)]
            border border-[var(--color-secondary)]/30
            text-[var(--color-text)]
            focus:outline-none focus:border-[var(--color-primary)]
            transition-colors
          "
        />

        {/* Dropdown if user is typing */}
        {inputValue && (
          <div
            className="
              absolute z-10 w-full mt-1
              bg-[var(--color-surface)]
              border border-[var(--color-secondary)]/30
              rounded-lg shadow-lg
              max-h-48 overflow-y-auto
            "
          >
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-[var(--color-text)]
                  hover:bg-[var(--color-primary)]/10
                  transition-colors
                "
                type="button"
              >
                {project.name}
              </button>
            ))}

            {!filteredProjects.length && inputValue.trim() && (
              <button
                onClick={handleAddProject}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-[var(--color-primary)]
                  hover:bg-[var(--color-primary)]/10
                  transition-colors
                  flex items-center gap-2
                "
                type="button"
              >
                <Plus className="w-4 h-4" />
                Create &quot;{inputValue}&quot;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ProjectSelect.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  onChange: PropTypes.func.isRequired
};

export default ProjectSelect;

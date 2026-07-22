import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ArrowLeft, Save, Plus, Trash2, Search, Dumbbell, ChevronRight, X, AlertTriangle } from 'lucide-react';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
};

function NumberStepper({ value, min = 0, onChange }) {
  const update = (next) => onChange(Math.max(min, next));
  return <div className="align-center">
    <button type="button" onClick={() => update((Number(value) || 0) - 1)} className="stepper-button">−</button>
    <input type="number" min={min} className="form-control compact-stepper-input" value={value} onChange={e => onChange(Math.max(min, parseInt(e.target.value) || min))} />
    <button type="button" onClick={() => update((Number(value) || 0) + 1)} className="stepper-button">+</button>
  </div>;
}

export default function CreateWorkout({ workoutId, onBack, onSaveSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([{ id: generateUuid(), name: 'Giorno 1', exercises: [] }]);
  const [activeDayId, setActiveDayId] = useState(null);
  
  // Database library data
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Selector state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom exercise form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  useEffect(() => {
    fetchExerciseLibrary();
    if (workoutId) loadWorkout();
  }, []);

  const loadWorkout = async () => {
    try {
      const plan = await api.getWorkoutDetails(workoutId);
      setName(plan.name || '');
      setDescription(plan.description || '');
      setDays(plan.days || []);
      setActiveDayId(plan.days?.[0]?.id || null);
    } catch (err) {
      setError('Impossibile caricare la scheda.');
    }
  };

  const activeDay = days.find(day => day.id === (activeDayId || days[0]?.id)) || days[0];
  const selectedExercises = activeDay?.exercises || [];
  const updateActiveDay = (updater) => {
    const dayId = activeDay.id;
    setDays(current => current.map(day => day.id === dayId ? updater(day) : day));
  };

  const addDay = () => {
    const newDay = { id: generateUuid(), name: `Giorno ${days.length + 1}`, exercises: [] };
    setDays(current => [...current, newDay]);
    setActiveDayId(newDay.id);
  };

  const removeDay = (dayId) => {
    if (days.length === 1) return;
    const remaining = days.filter(day => day.id !== dayId);
    setDays(remaining);
    if (activeDayId === dayId) setActiveDayId(remaining[0].id);
  };

  const fetchExerciseLibrary = async () => {
    setLoading(true);
    try {
      const catsData = await api.getCategories();
      const exData = await api.getExercises();
      setCategories(catsData.categories || []);
      setExercises(exData.exercises || []);
      if (catsData.categories && catsData.categories.length > 0) {
        setSelectedCategoryTab(catsData.categories[0].id);
        setCustomCategory(catsData.categories[0].id);
      }
    } catch (err) {
      console.error('Error fetching exercise library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExerciseToPlan = (exercise) => {
    // Add exercise with default sets and reps
    const newEntry = {
      exerciseId: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: '10',
      restTime: 60
    };
    updateActiveDay(day => ({ ...day, exercises: [...day.exercises, newEntry] }));
    setShowAddModal(false);
    setSearchQuery('');
  };

  const handleRemoveExercise = (index) => {
    updateActiveDay(day => ({ ...day, exercises: day.exercises.filter((_, i) => i !== index) }));
  };

  const handleUpdateExerciseParam = (index, param, value) => {
    updateActiveDay(day => ({ ...day, exercises: day.exercises.map((exercise, i) => i === index ? { ...exercise, [param]: value } : exercise) }));
  };

  const handleCreateCustomExercise = async (e) => {
    e.preventDefault();
    if (!customName || !customCategory) return;

    try {
      const result = await api.createCustomExercise(customName, customCategory, customDesc);
      const newEx = result.exercise;
      
      // Update local state list of exercises
      setExercises([...exercises, newEx]);
      
      // Add immediately to the workout plan
      handleAddExerciseToPlan(newEx);
      
      // Reset custom form
      setCustomName('');
      setCustomDesc('');
      setShowCustomForm(false);
    } catch (err) {
      alert(err.message || 'Errore nella creazione dell\'esercizio.');
    }
  };

  const handleSaveWorkout = async () => {
    if (!name) {
      setError('Inserisci il nome della scheda.');
      return;
    }
    if (days.some(day => !day.name.trim()) || days.some(day => day.exercises.length === 0)) {
      setError('Ogni giorno deve avere un nome e almeno un esercizio.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (workoutId) await api.updateWorkout(workoutId, name, description, days);
      else await api.createWorkout(name, description, days);
      onSaveSuccess();
    } catch (err) {
      setError(err.message || 'Errore nel salvataggio della scheda.');
    } finally {
      setSaving(false);
    }
  };

  // Filter exercises based on search and category
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = ex.categoryId === selectedCategoryTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="create-workout-page">
      {/* Header */}
      <div className="create-workout-header">
        <div className="create-workout-header-left">
          <button className="button-circle" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="create-workout-title">{workoutId ? 'Modifica Scheda' : 'Nuova Scheda'}</h1>
        </div>

        <button 
          onClick={handleSaveWorkout}
          className="btn-primary create-workout-status-button"
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>

      {/* Main Form content */}
      <div className="create-workout-content">
        {error && (
          <div className="alert-panel alert-panel--danger">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Plan Details */}
        <div className="glass-panel create-workout-section">
          <div className="form-group">
            <label>NOME SCHEDA</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Scheda A - Spinta, Forza"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group form-group--no-bottom">
            <label>DESCRIZIONE (OPZIONALE)</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Lunedì - Focus Petto e Spalle"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <section className="create-workout-section">
          <div className="create-workout-section-head">
            <h3 className="section-heading">Giorni della scheda</h3>
            <button onClick={addDay} className="btn-secondary create-workout-empty-button"><Plus size={14} /> Aggiungi giorno</button>
          </div>

          <div className="create-workout-day-list">
            {days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setActiveDayId(day.id)}
                className={`create-workout-day-pill ${activeDay.id === day.id ? 'create-workout-day-pill--active' : ''}`}
              >
                {day.name || `Giorno ${index + 1}`} · {day.exercises.length}
              </button>
            ))}
          </div>

          <div className="glass-panel create-workout-day-detail">
            <label className="create-workout-day-label">NOME DEL GIORNO</label>
            <div className="create-workout-day-controls">
              <input className="form-control" value={activeDay.name} placeholder="es. Giorno A — Spinta" onChange={e => updateActiveDay(day => ({ ...day, name: e.target.value }))} />
              {days.length > 1 && <button onClick={() => removeDay(activeDay.id)} title="Elimina giorno" className="create-workout-remove-button"><Trash2 size={17} /></button>}
            </div>
          </div>
        </section>

        {/* Selected Exercises List */}
        <div className="create-workout-section">
          <div className="create-workout-section-head">
            <h3 className="section-heading">Esercizi — {activeDay.name || 'Giorno'}</h3>
            <span className="text-small text-muted">{selectedExercises.length} selezionati</span>
          </div>

          {selectedExercises.length === 0 ? (
            <div className="create-workout-empty-card">
              <p className="text-muted">Nessun esercizio ancora aggiunto.</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="btn-secondary create-workout-empty-button"
              >
                <Plus size={14} /> Aggiungi esercizio
              </button>
            </div>
          ) : (
            <div className="flex-column-gap">
              {selectedExercises.map((entry, index) => (
                <div key={index} className="glass-panel create-workout-exercise-card">
                  <div className="create-workout-exercise-info">
                    <h4>{entry.name}</h4>
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="button-ghost button-ghost--danger"
                      title="Rimuovi esercizio"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="create-workout-params">
                    <div className="create-workout-param">
                      <label>SERIE</label>
                      <NumberStepper min={1} value={entry.sets} onChange={value => handleUpdateExerciseParam(index, 'sets', value)} />
                    </div>
                    <div className="create-workout-param">
                      <label>RIPETIZIONI</label>
                      <NumberStepper min={1} value={parseInt(entry.reps) || 1} onChange={value => handleUpdateExerciseParam(index, 'reps', String(value))} />
                    </div>
                    <div className="create-workout-param">
                      <label>RECUPERO (S)</label>
                      <NumberStepper value={entry.rest_time} onChange={value => handleUpdateExerciseParam(index, 'rest_time', value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => setShowAddModal(true)} 
                className="btn-secondary create-workout-add-button"
              >
                <Plus size={16} /> Aggiungi altro esercizio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide-up Exercise Selector Drawer / Modal */}
      {showAddModal && (
        <div className="create-workout-modal-backdrop" onClick={() => { setShowAddModal(false); setShowCustomForm(false); }}>
          <div className="create-workout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-workout-modal-header">
              <h3>Seleziona Esercizio</h3>
              <button 
                onClick={() => { setShowAddModal(false); setShowCustomForm(false); }}
                className="button-circle button-circle-small"
              >
                <X size={16} />
              </button>
            </div>

            {!showCustomForm && (
              <div className="create-workout-modal-search">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="form-control create-workout-search-input"
                  placeholder="Cerca esercizio per nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <div className="create-workout-modal-toggle">
              <button
                onClick={() => setShowCustomForm(!showCustomForm)}
                className={`button-toggle ${showCustomForm ? 'button-toggle--active' : 'button-toggle--inactive'}`}
                type="button"
              >
                {showCustomForm ? 'Annulla esercizio personalizzato' : '+ Crea esercizio personalizzato'}
              </button>
            </div>

            {showCustomForm ? (
              <form onSubmit={handleCreateCustomExercise} className="create-workout-modal-form">
                <h4>Nuovo Esercizio Custom</h4>
                <div className="form-group">
                  <label>NOME ESERCIZIO</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="es. Piegamenti a Diamante"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CATEGORIA</label>
                  <select
                    className="form-control"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-group--no-bottom">
                  <label>DESCRIZIONE (OPZIONALE)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="es. Focus parte interna dei tricipiti"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary create-workout-full-width-button">
                  Crea ed Aggiungi
                </button>
              </form>
            ) : (
              <>
                <div className="create-workout-category-list">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryTab(cat.id)}
                      className={`category-pill ${selectedCategoryTab === cat.id ? 'category-pill--active' : 'category-pill--inactive'}`}
                      type="button"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="exercise-selector">
                  {filteredExercises.length === 0 ? (
                    <div className="empty-state-card">
                      Nessun esercizio trovato in questa categoria.
                    </div>
                  ) : (
                    <div className="flex-column-gap">
                      {filteredExercises.map(ex => (
                        <button
                          key={ex.id}
                          onClick={() => handleAddExerciseToPlan(ex)}
                          className="exercise-selector-item glass-panel"
                          type="button"
                        >
                          <div className="exercise-selector-info">
                            <div className="exercise-name">{ex.name}</div>
                            {ex.description && <div className="exercise-subtitle">{ex.description}</div>}
                          </div>
                          <ChevronRight size={14} className="icon-muted" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

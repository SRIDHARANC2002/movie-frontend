import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEdit,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { updateUserDetails, updateUserDetailsAsync } from '../../store/Slices/auth';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: '' });
  // Parse date of birth into day, month, year if available
  const parseDateOfBirth = (dateString) => {
    if (!dateString) return { day: '', month: '', year: '' };

    const parts = dateString.split('/');
    if (parts.length === 3) {
      return {
        day: parts[0],
        month: parts[1],
        year: parts[2]
      };
    }

    return { day: '', month: '', year: '' };
  };

  const dobParts = parseDateOfBirth(user?.dateOfBirth);

  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    day: dobParts.day,
    month: dobParts.month,
    year: dobParts.year,
    address: user?.address || '',
    username: user?.username || ''
  });

  // Reset edited user when user changes
  useEffect(() => {
    const dobParts = parseDateOfBirth(user?.dateOfBirth);

    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      day: dobParts.day,
      month: dobParts.month,
      year: dobParts.year,
      address: user?.address || '',
      username: user?.username || ''
    });
  }, [user]);

  // Indian Phone Number Formatting Function
  const formatIndianPhoneNumber = (phoneNumber) => {
    // Return empty string if phoneNumber is undefined or null
    if (!phoneNumber) return '';

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Limit to 10 digits
    const trimmed = cleaned.slice(0, 10);

    // Return plain format if less than 10 digits
    if (trimmed.length < 10) {
        return trimmed;
    }

    // Return standard 10-digit format without formatting
    return trimmed;
  };

  // Removed unused formatPhoneNumber function

  // Date of Birth validation function
  // eslint-disable-next-line no-unused-vars
  const validateDateFormat = (dateString) => {
    if (!dateString) return true; // Empty is valid

    // Check format DD/MM/YYYY
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (!regex.test(dateString)) return false;

    // Extract day, month, year
    const [, day, month, year] = dateString.match(regex);

    // Check month and day validity
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) return false;

    // Check days in month
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) return false;

    // Check year is reasonable (between 1900 and current year)
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) return false;

    return true;
  };

  // Function to update dateOfBirth when day, month, or year changes
  const updateDateOfBirth = (field, value) => {
    setEditedUser(prev => {
      const newState = { ...prev, [field]: value };

      // Only update dateOfBirth if all fields have values
      if (newState.day && newState.month && newState.year) {
        newState.dateOfBirth = `${newState.day}/${newState.month}/${newState.year}`;
      } else {
        // If any field is empty, clear dateOfBirth
        newState.dateOfBirth = '';
      }

      return newState;
    });
  };

  const ControlledInput = ({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    formatFunction
  }) => {
    const [inputValue, setInputValue] = useState(value || '');
    const inputRef = useRef(null);
    const [selectionState, setSelectionState] = useState({
      start: 0,
      end: 0
    });
    const [isComposing, setIsComposing] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const cursorPosition = useCursorTracking(inputRef);

    useEffect(() => {
      setInputValue(value || '');
    }, [value]);

    const preserveSelection = (input) => {
      if (input && !isComposing) {
        try {
          input.setSelectionRange(
            selectionState.start,
            selectionState.end
          );
        } catch (error) {
          console.error('Selection preservation failed', error);
        }
      }
    };

    const handleChange = (e) => {
      const input = e.target;
      const newValue = input.value;

      // Prevent composition events from interfering
      if (isComposing) return;

      // Capture current selection state
      const currentStart = input.selectionStart;
      const currentEnd = input.selectionEnd;

      // Update input value and selection state
      setInputValue(newValue);
      setSelectionState({
        start: currentStart,
        end: currentEnd
      });

      // Create synthetic event
      const syntheticEvent = {
        target: {
          name: name,
          value: newValue
        }
      };

      // Call parent onChange
      onChange(syntheticEvent);

      // Preserve selection in next render cycle
      requestAnimationFrame(() => {
        if (inputRef.current) {
          preserveSelection(inputRef.current);
        }
      });
    };

    const handleKeyDown = (e) => {
      const input = e.target;
      const { name, value } = input;

      // Enhanced key handling
      switch (e.key) {
        case 'Backspace':
        case 'Delete':
          // Ensure cursor moves to end after deletion
          requestAnimationFrame(() => {
            const processedValue = name === 'phone'
                ? value.replace(/\D/g, '').slice(0, 10)
                : value;

            const inputElement = document.getElementsByName(name)[0];
            if (inputElement) {
              const newCursorPosition = processedValue.length;
              inputElement.setSelectionRange(
                newCursorPosition,
                newCursorPosition
              );

              // Update display with formatted number
              if (name === 'phone') {
                inputElement.value = formatIndianPhoneNumber(processedValue);
              }
            }
          });
          return;

        case 'ArrowLeft':
        case 'ArrowRight':
          // Preserve cursor movement
          return;

        default:
          // Phone number specific validation
          if (name === 'phone') {
            if (!/^[0-9]$/.test(e.key)) {
              e.preventDefault();
            }
          }
      }
    };

    const handleFocus = (e) => {
      // Select all text on focus
      e.target.select();

      // Update selection state
      setSelectionState({
        start: 0,
        end: e.target.value.length
      });
    };

    const handleMouseUp = (e) => {
      // Capture selection on mouse up
      setSelectionState({
        start: e.target.selectionStart,
        end: e.target.selectionEnd
      });
    };

    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = (e) => {
      setIsComposing(false);
      handleChange(e);
    };

    return (
      <div className="mb-3">
        <label className="form-label">{label}</label>
        <input
          ref={inputRef}
          type={type}
          className="form-control"
          name={name}
          value={formatFunction ? formatFunction(inputValue) : inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onMouseUp={handleMouseUp}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    );
  };

  const handleInputChange = (e) => {
    const input = e.target;
    const { name, value } = input;

    // Process value based on input type
    let processedValue;

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'dateOfBirth') {
      // Auto-format date as user types
      // eslint-disable-next-line no-useless-escape
      const cleaned = value.replace(/[^\d\/]/g, '');

      // Apply DD/MM/YYYY format automatically
      if (cleaned.length <= 2) {
        processedValue = cleaned;
      } else if (cleaned.length <= 5) {
        const day = cleaned.substring(0, 2);
        const rest = cleaned.substring(2).replace(/^\//, '');
        processedValue = `${day}/${rest}`;
      } else {
        const day = cleaned.substring(0, 2);
        const month = cleaned.substring(2, 4).replace(/^\//, '');
        const year = cleaned.substring(4).replace(/^\//, '');
        processedValue = `${day}/${month}/${year}`;
      }
    } else {
      processedValue = value;
    }

    // Update user state
    setEditedUser((prev) => ({
        ...prev,
        [name]: processedValue
    }));

    // Advanced cursor preservation
    requestAnimationFrame(() => {
        const inputElement = document.getElementsByName(name)[0];
        if (inputElement) {
            try {
                inputElement.focus();

                // Always place cursor at the end after input
                const newCursorPosition = processedValue.length;

                inputElement.setSelectionRange(
                    newCursorPosition,
                    newCursorPosition
                );

                // Update display with formatted number
                if (name === 'phone') {
                    inputElement.value = formatIndianPhoneNumber(processedValue);
                }
            } catch (error) {
                console.error('Cursor preservation failed', error);
            }
        }
    });
  };

  const useCursorTracking = (inputRef) => {
    // Using a ref instead of state to avoid unused variable warning
    const cursorPositionRef = useRef(0);

    const handleCursorChange = useCallback(() => {
      if (inputRef.current) {
        cursorPositionRef.current = inputRef.current.selectionStart;
      }
    }, [inputRef]);

    useEffect(() => {
      const currentInput = inputRef.current;
      if (currentInput) {
        currentInput.addEventListener('select', handleCursorChange);
        currentInput.addEventListener('keyup', handleCursorChange);
        currentInput.addEventListener('mouseup', handleCursorChange);

        return () => {
          currentInput.removeEventListener('select', handleCursorChange);
          currentInput.removeEventListener('keyup', handleCursorChange);
          currentInput.removeEventListener('mouseup', handleCursorChange);
        };
      }
    }, [inputRef, handleCursorChange]);

    return cursorPositionRef.current;
  };

  const handleSave = async () => {
    try {
      // Clear any previous status messages
      setSaveStatus({ success: false, message: '' });

      // Validate date of birth if any of the fields are provided
      if ((editedUser.day || editedUser.month || editedUser.year) &&
          !(editedUser.day && editedUser.month && editedUser.year)) {
        setSaveStatus({
          success: false,
          message: 'Please complete all date of birth fields (day, month, and year)'
        });
        return;
      }

      // First update the local state for immediate UI feedback
      dispatch(updateUserDetails(editedUser));

      // Then send the update to the backend
      const result = await dispatch(updateUserDetailsAsync(editedUser)).unwrap();

      // Show success message
      setSaveStatus({
        success: true,
        message: 'Profile updated successfully! Your details have been saved to the database.'
      });

      console.log('✅ Profile updated successfully:', result);

      // Close the editing mode after a short delay to show the success message
      setTimeout(() => {
        setIsEditing(false);
        // Clear the success message after closing edit mode
        setSaveStatus({ success: false, message: '' });
      }, 2000);
    } catch (error) {
      console.error('Failed to update user details:', error);
      // Show error message
      setSaveStatus({
        success: false,
        message: `Failed to update profile: ${error}`
      });
    }
  };

  const handleCancel = () => {
    // Reset to original user details
    const dobParts = parseDateOfBirth(user?.dateOfBirth);

    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      day: dobParts.day,
      month: dobParts.month,
      year: dobParts.year,
      address: user?.address || '',
      username: user?.username || ''
    });
    setIsEditing(false);
  };

  // Show loading spinner when loading
  if (loading && !user) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-10 text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h3 className="mt-3">Loading your profile...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h2>User Profile</h2>
              {!isEditing ? (
                <button
                  className="btn btn-light"
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faEdit} className="me-2" />
                  Edit Profile
                </button>
              ) : (
                <div>
                  <button
                    className="btn btn-success me-2"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faTimes} className="me-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="card-body">
              {/* Status Messages */}
              {saveStatus.message && (
                <div className={`alert ${saveStatus.success ? 'alert-success' : 'alert-danger'} mb-3`} role="alert">
                  {saveStatus.message}
                </div>
              )}

              {/* Error from Redux state */}
              {error && !saveStatus.message && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}

              {user ? (
                <div className="row">
                  <div className="col-md-4 text-center">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="mb-4"
                      style={{
                        fontSize: '8rem',
                        color: '#6c757d'
                      }}
                    />
                    <h3 className="mb-2">{user.name}</h3>
                    <p className="text-muted">{user.email}</p>
                  </div>
                  <div className="col-md-8">
                    {isEditing ? (
                      <form autoComplete="off">
                        <div className="row">
                          <div className="col-md-6">
                            <ControlledInput
                              label="Full Name"
                              name="name"
                              value={editedUser.name}
                              onChange={handleInputChange}
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div className="col-md-6">
                            <ControlledInput
                              label="Email"
                              name="email"
                              type="email"
                              value={editedUser.email}
                              onChange={handleInputChange}
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <ControlledInput
                              label="Phone"
                              name="phone"
                              value={editedUser.phone}
                              onChange={handleInputChange}
                              placeholder="Enter your phone number"
                              formatFunction={formatIndianPhoneNumber}
                            />
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Date of Birth</label>
                              <div className="row g-2">
                                {/* Day dropdown */}
                                <div className="col-4">
                                  <select
                                    className="form-select"
                                    value={editedUser.day}
                                    onChange={(e) => updateDateOfBirth('day', e.target.value)}
                                  >
                                    <option value="">Day</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                      <option key={day} value={day}>{day}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Month dropdown */}
                                <div className="col-4">
                                  <select
                                    className="form-select"
                                    value={editedUser.month}
                                    onChange={(e) => updateDateOfBirth('month', e.target.value)}
                                  >
                                    <option value="">Month</option>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                  </select>
                                </div>

                                {/* Year dropdown */}
                                <div className="col-4">
                                  <select
                                    className="form-select"
                                    value={editedUser.year}
                                    onChange={(e) => updateDateOfBirth('year', e.target.value)}
                                  >
                                    <option value="">Year</option>
                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <small className="text-muted">Select your date of birth</small>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <ControlledInput
                              label="Address"
                              name="address"
                              value={editedUser.address}
                              onChange={handleInputChange}
                              placeholder="Enter your address"
                            />
                          </div>
                          <div className="col-md-6">
                            <ControlledInput
                              label="Username"
                              name="username"
                              value={editedUser.username}
                              onChange={handleInputChange}
                              placeholder="Enter your username"
                            />
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Full Name:</strong></div>
                          <div className="col-8">{user.name || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Email:</strong></div>
                          <div className="col-8">{user.email || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Phone:</strong></div>
                          <div className="col-8">{formatIndianPhoneNumber(user.phone) || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Date of Birth:</strong></div>
                          <div className="col-8">{user.dateOfBirth || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Address:</strong></div>
                          <div className="col-8">{user.address || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Username:</strong></div>
                          <div className="col-8">{user.username || 'Not provided'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="mb-4"
                    style={{
                      fontSize: '5rem',
                      color: '#6c757d'
                    }}
                  />
                  <p className="text-muted">No user logged in</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

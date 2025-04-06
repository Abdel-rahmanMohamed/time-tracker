// Main application controller

class TimeTrackerApp {
    constructor() {
        // DOM elements - Forms
        this.activityForm = document.getElementById('activity-form');
        this.categoryForm = document.getElementById('category-form');
        this.settingsForm = document.getElementById('settings-form');
        
        // DOM elements - Inputs
        this.activityDescription = document.getElementById('activity-description');
        this.activityStart = document.getElementById('activity-start');
        this.activityEnd = document.getElementById('activity-end');
        this.activityCategory = document.getElementById('activity-category');
        this.activityTags = document.getElementById('activity-tags');
        this.categoryName = document.getElementById('category-name');
        this.categoryColor = document.getElementById('category-color');
        this.encryptionPassword = document.getElementById('encryption-password');
        
        // DOM elements - Buttons and controls
        this.addCategoryButton = document.getElementById('add-category-button');
        this.activitiesSearch = document.getElementById('activities-search');
        this.activitiesFilter = document.getElementById('activities-filter');
        this.importButton = document.getElementById('import-button');
        this.settingsButton = document.getElementById('settings-button');
        
        // DOM elements - Containers
        this.activitiesList = document.getElementById('activities-list');
        
        // DOM elements - Modals
        this.categoryModal = document.getElementById('category-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeModalButtons = document.querySelectorAll('.close-modal');

        // Add these new DOM elements for date filtering
        this.dateFilterStart = document.getElementById('date-filter-start');
        this.dateFilterEnd = document.getElementById('date-filter-end');
        this.applyDateFilterButton = document.getElementById('apply-date-filter');
        this.clearDateFilterButton = document.getElementById('clear-date-filter');

        
        // Bind event handlers
        this.bindEventHandlers();
        
        // Default categories
        this.defaultCategories = [
            { name: 'Work', color: '#4285f4' },
            { name: 'Study', color: '#34a853' },
            { name: 'Personal', color: '#fbbc05' },
            { name: 'Exercise', color: '#ea4335' },
            { name: 'Entertainment', color: '#9c27b0' }
        ];
        
        // Current activity being edited
        this.currentActivityId = null;
    }
    
    // Initialize the application
    async initialize() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Initialize encryption
            await encryption.initialize();
            
            // Initialize database
            await db.init();
            
            // Set up default categories if none exist
            await this.setupDefaultCategories();
            
            // Populate category dropdowns
            await this.populateCategoryDropdowns();
            
            // Initialize Google Drive integration
            await driveBackup.initialize();
            
            // Load activities
            await this.refreshActivityList();
            
            // Initialize visualizations
            await visualizations.initialize();
            
            // Handle timer stop
            this.setupTimerHandling();
            
            // Pre-fill date fields with current date and time
            this.prefillDateFields();
            
            // Hide loading state
            this.hideLoadingState();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            alert('Error initializing application. Please check console for details.');
        }
    }
    
    // Show loading state
    showLoadingState() {
        // Could add a loading spinner here
        document.body.classList.add('loading');
    }
    
    // Hide loading state
    hideLoadingState() {
        document.body.classList.remove('loading');
    }
    
    // Add this new method to clear the date filters
    clearDateFilter() {
        this.dateFilterStart.value = '';
        this.dateFilterEnd.value = '';
        this.refreshActivityList();
    }

    // Bind all event handlers
    bindEventHandlers() {
        // Form submissions
        this.activityForm.addEventListener('submit', this.handleActivitySubmit.bind(this));
        this.categoryForm.addEventListener('submit', this.handleCategorySubmit.bind(this));
        this.settingsForm.addEventListener('submit', this.handleSettingsSubmit.bind(this));
        
        // Button clicks
        this.addCategoryButton.addEventListener('click', this.showCategoryModal.bind(this));
        this.settingsButton.addEventListener('click', this.showSettingsModal.bind(this));
        this.importButton.addEventListener('click', this.handleImportClick.bind(this));
        
        // Search and filter
        this.activitiesSearch.addEventListener('input', this.handleSearchFilter.bind(this));
        this.activitiesFilter.addEventListener('change', this.handleSearchFilter.bind(this));
        
        // Date filter buttons
        this.applyDateFilterButton.addEventListener('click', this.handleSearchFilter.bind(this));
        this.clearDateFilterButton.addEventListener('click', this.clearDateFilter.bind(this));    

        // Modal close buttons
        this.closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.categoryModal.style.display = 'none';
                this.settingsModal.style.display = 'none';
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.categoryModal) {
                this.categoryModal.style.display = 'none';
            }
            if (event.target === this.settingsModal) {
                this.settingsModal.style.display = 'none';
            }
        });
    }
    
    // Set up default categories if none exist
    async setupDefaultCategories() {
        const categories = await db.getAll('categories');
        
        if (!categories || categories.length === 0) {
            console.log('Setting up default categories');
            
            for (const category of this.defaultCategories) {
                await db.addItem('categories', category);
            }
        }
    }
    
    // Populate category dropdowns
    async populateCategoryDropdowns() {
        const categories = await db.getAll('categories');
        
        if (!categories || categories.length === 0) {
            return;
        }
        
        // Sort categories by name
        categories.sort((a, b) => a.name.localeCompare(b.name));
        
        // Clear existing options (except the first one)
        while (this.activityCategory.options.length > 1) {
            this.activityCategory.remove(1);
        }
        
        while (this.activitiesFilter.options.length > 1) {
            this.activitiesFilter.remove(1);
        }
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            this.activityCategory.appendChild(option);
            
            const filterOption = document.createElement('option');
            filterOption.value = category.id;
            filterOption.textContent = category.name;
            this.activitiesFilter.appendChild(filterOption);
        });
    }
    
    // Pre-fill date fields with current date and time
    prefillDateFields() {
        const now = new Date();
        const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        
        this.activityStart.value = localDatetime;
        this.activityEnd.value = localDatetime;
    }
    
    // Setup timer handling
    setupTimerHandling() {
        // When timer is stopped, use the data to pre-fill the form
        document.addEventListener('timer-stopped', (event) => {
            console.log('Timer stopped event received:', event.detail);
            const timerData = event.detail;
            
            // Format dates for the form
            const startLocalDatetime = this.formatDatetimeForInput(timerData.startTime);
            const endLocalDatetime = this.formatDatetimeForInput(timerData.endTime);
            
            // Fill in the form
            this.activityStart.value = startLocalDatetime;
            this.activityEnd.value = endLocalDatetime;
            
            // Scroll to and focus the description field
            this.activityDescription.scrollIntoView({ behavior: 'smooth' });
            this.activityDescription.focus();
            
            // Show a notification that the timer was stopped and activity can be saved
            alert(`Timer stopped! Duration: ${timerData.durationFormatted}\nEnter a description for the activity and save it.`);
        });
    }

    // Helper method to format date for datetime-local input
    formatDatetimeForInput(date) {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    }
    
    // Handle activity form submission
    async handleActivitySubmit(event) {
        event.preventDefault();
        
        try {
            // Get form values
            const description = this.activityDescription.value.trim();
            const startTime = new Date(this.activityStart.value);
            const endTime = new Date(this.activityEnd.value);
            const categoryId = parseInt(this.activityCategory.value);
            
            // Parse tags (comma separated)
            const tagNames = this.activityTags.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag !== '');
            
            // Validate input
            if (!description) {
                alert('Please enter a description.');
                return;
            }
            
            if (isNaN(startTime.getTime())) {
                alert('Please enter a valid start time.');
                return;
            }
            
            if (isNaN(endTime.getTime())) {
                alert('Please enter a valid end time.');
                return;
            }
            
            if (endTime <= startTime) {
                alert('End time must be after start time.');
                return;
            }
            
            if (isNaN(categoryId)) {
                alert('Please select a category.');
                return;
            }
            
            // Process tags - get existing or create new ones
            const tagIds = [];
            for (const tagName of tagNames) {
                // Check if tag exists
                const existingTags = await db.getAll('tags');
                let existingTag = existingTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
                
                if (existingTag) {
                    tagIds.push(existingTag.id);
                } else {
                    // Create new tag
                    const newTagId = await db.addItem('tags', { name: tagName });
                    tagIds.push(newTagId);
                }
            }
            
            // Create activity object
            const activity = {
                description,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                categoryId,
                tags: tagIds,
                createdAt: new Date().toISOString()
            };
            
            // Save or update activity
            if (this.currentActivityId) {
                // Update existing activity
                await db.updateItem('activities', this.currentActivityId, activity);
                this.currentActivityId = null;
            } else {
                // Add new activity
                await db.addItem('activities', activity);
            }
            
            // Reset form
            this.activityForm.reset();
            this.prefillDateFields();
            
            // Refresh activity list
            await this.refreshActivityList();
            
            // Update visualizations
            await visualizations.updateAllCharts();
            
        } catch (error) {
            console.error('Error saving activity:', error);
            alert('Error saving activity. See console for details.');
        }
    }
    
    // Handle category form submission
    async handleCategorySubmit(event) {
        event.preventDefault();
        
        try {
            // Get form values
            const name = this.categoryName.value.trim();
            const color = this.categoryColor.value;
            
            // Validate input
            if (!name) {
                alert('Please enter a category name.');
                return;
            }
            
            // Create category object
            const category = {
                name,
                color
            };
            
            // Save category
            await db.addItem('categories', category);
            
            // Reset form
            this.categoryForm.reset();
            this.categoryColor.value = '#4285f4';
            
            // Hide modal
            this.categoryModal.style.display = 'none';
            
            // Refresh category dropdowns
            await this.populateCategoryDropdowns();
            
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category. See console for details.');
        }
    }
    
    // Handle settings form submission
    async handleSettingsSubmit(event) {
        event.preventDefault();
        
        try {
            // Get form values
            const password = this.encryptionPassword.value.trim();
            
            // Handle encryption settings
            if (password) {
                // Enable or update encryption
                const passwordData = encryption.hashPassword(password);
                
                if (!passwordData) {
                    throw new Error('Failed to hash password');
                }
                
                // Set encryption key
                encryption.setEncryptionKey(passwordData.hash);
                
                // Save encryption settings
                await db.setItem('settings', {
                    id: 'encryption',
                    enabled: true,
                    hash: passwordData.hash,
                    salt: passwordData.salt
                });
                
                alert('Encryption enabled with new password.');
            } else {
                // Check if encryption is currently enabled
                const encryptionSettings = await db.getItem('settings', 'encryption');
                
                if (encryptionSettings && encryptionSettings.enabled) {
                    // Confirm before disabling encryption
                    const confirm = window.confirm(
                        'Are you sure you want to disable encryption? This will make your data less secure.'
                    );
                    
                    if (confirm) {
                        // Disable encryption
                        await db.deleteItem('settings', 'encryption');
                        encryption.setEncryptionKey(null);
                        alert('Encryption disabled.');
                    }
                }
            }
            
            // Hide modal
            this.settingsModal.style.display = 'none';
            
            // Reset form
            this.settingsForm.reset();
            
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. See console for details.');
        }
    }
    
    // Show category modal
    showCategoryModal() {
        this.categoryModal.style.display = 'block';
    }
    
    // Show settings modal
    showSettingsModal() {
        this.settingsModal.style.display = 'block';
    }
    
    // Handle import button click
    handleImportClick() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        // Handle file selection
        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                // Read file content
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    const jsonData = e.target.result;
                    
                    // Confirm before import
                    const confirm = window.confirm(
                        'This will replace all your current data. Are you sure you want to continue?'
                    );
                    
                    if (!confirm) return;
                    
                    // Import data
                    const success = await db.importData(jsonData);
                    
                    if (success) {
                        alert('Data imported successfully.');
                        
                        // Refresh app state
                        await this.populateCategoryDropdowns();
                        await this.refreshActivityList();
                        await visualizations.updateAllCharts();
                    } else {
                        alert('Failed to import data. The file may be corrupted or invalid.');
                    }
                };
                
                reader.readAsText(file);
                
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error importing data. See console for details.');
            }
        };
        
        // Trigger file selection
        fileInput.click();
    }
    
    // Handle search and filter
    async handleSearchFilter() {
        await this.refreshActivityList();
    }
    
    // Refresh the activities list
    async refreshActivityList() {
        try {
            // Get search, filter, and date range values
            const searchTerm = this.activitiesSearch.value.trim().toLowerCase();
            const categoryFilter = this.activitiesFilter.value;
            const dateFilterStart = this.dateFilterStart.value ? new Date(this.dateFilterStart.value) : null;
            const dateFilterEnd = this.dateFilterEnd.value ? new Date(this.dateFilterEnd.value) : null;
            
            // Get all activities
            const activities = await db.getAll('activities');
            
            if (!activities || activities.length === 0) {
                this.activitiesList.innerHTML = '<p>No activities yet. Start tracking your time!</p>';
                return;
            }
            
            // Get categories for lookup
            const categories = await db.getAll('categories');
            const categoryMap = {};
            categories.forEach(category => {
                categoryMap[category.id] = category;
            });
            
            // Get tags for lookup
            const tags = await db.getAll('tags');
            const tagMap = {};
            tags.forEach(tag => {
                tagMap[tag.id] = tag;
            });
            
            // Filter activities
            const filteredActivities = activities.filter(activity => {
                // Filter by category
                if (categoryFilter && activity.categoryId != categoryFilter) {
                    return false;
                }
                
                // Filter by date range
                if (dateFilterStart || dateFilterEnd) {
                    const activityStart = new Date(activity.startTime);
                    const activityEnd = new Date(activity.endTime);
                    
                    // Check start date if set
                    if (dateFilterStart && activityStart < dateFilterStart) {
                        return false;
                    }
                    
                    // Check end date if set
                    if (dateFilterEnd && activityEnd > dateFilterEnd) {
                        return false;
                    }
                }
                
                // Filter by search term
                if (searchTerm) {
                    const description = activity.description.toLowerCase();
                    
                    // Check description
                    if (description.includes(searchTerm)) {
                        return true;
                    }
                    
                    // Check category name
                    const category = categoryMap[activity.categoryId];
                    if (category && category.name.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                    
                    // Check tags
                    if (activity.tags && Array.isArray(activity.tags)) {
                        for (const tagId of activity.tags) {
                            const tag = tagMap[tagId];
                            if (tag && tag.name.toLowerCase().includes(searchTerm)) {
                                return true;
                            }
                        }
                    }
                    
                    // No match found
                    return false;
                }
                
                // No filters applied or matched all filters
                return true;
            });
            
            // Sort by start time (most recent first)
            filteredActivities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            
            // Clear activities list
            this.activitiesList.innerHTML = '';
            
            // Show filter summary if date filter is applied
            if (dateFilterStart || dateFilterEnd) {
                const filterSummary = document.createElement('div');
                filterSummary.className = 'filter-summary';
                
                let summaryText = 'Showing activities ';
                if (dateFilterStart && dateFilterEnd) {
                    summaryText += `from ${new Date(dateFilterStart).toLocaleString()} to ${new Date(dateFilterEnd).toLocaleString()}`;
                } else if (dateFilterStart) {
                    summaryText += `after ${new Date(dateFilterStart).toLocaleString()}`;
                } else if (dateFilterEnd) {
                    summaryText += `before ${new Date(dateFilterEnd).toLocaleString()}`;
                }
                
                filterSummary.textContent = summaryText;
                this.activitiesList.appendChild(filterSummary);
            }
            
            // No activities match the filter
            if (filteredActivities.length === 0) {
                const noActivitiesElement = document.createElement('p');
                noActivitiesElement.textContent = 'No activities match the current filters.';
                this.activitiesList.appendChild(noActivitiesElement);
                return;
            }
            
            // Build activities list
            filteredActivities.forEach(activity => {
                const startTime = new Date(activity.startTime);
                const endTime = new Date(activity.endTime);
                const duration = endTime - startTime;
                
                // Format dates
                const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
                const timeOptions = { hour: '2-digit', minute: '2-digit' };
                
                const dateStr = startTime.toLocaleDateString(undefined, dateOptions);
                const startTimeStr = startTime.toLocaleTimeString(undefined, timeOptions);
                const endTimeStr = endTime.toLocaleTimeString(undefined, timeOptions);
                
                // Format duration
                const hours = Math.floor(duration / (1000 * 60 * 60));
                const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                const durationStr = `${hours}h ${minutes}m`;
                
                // Get category
                const category = categoryMap[activity.categoryId];
                
                // Create activity element
                const activityElement = document.createElement('div');
                activityElement.className = 'activity-item';
                
                // Activity HTML
                let activityHtml = `
                    <div class="activity-details">
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${dateStr}, ${startTimeStr} - ${endTimeStr} (${durationStr})</div>
                        <div class="activity-meta">
                `;
                
                // Add category
                if (category) {
                    activityHtml += `
                        <span class="activity-category" style="background-color: ${category.color}">
                            ${category.name}
                        </span>
                    `;
                }
                
                // Add tags
                if (activity.tags && Array.isArray(activity.tags)) {
                    activity.tags.forEach(tagId => {
                        const tag = tagMap[tagId];
                        if (tag) {
                            activityHtml += `<span class="activity-tag">${tag.name}</span>`;
                        }
                    });
                }
                
                activityHtml += `
                        </div>
                    </div>
                    <div class="activity-actions">
                        <button class="edit-activity" data-id="${activity.id}">Edit</button>
                        <button class="delete-activity" data-id="${activity.id}">Delete</button>
                    </div>
                `;
                
                activityElement.innerHTML = activityHtml;
                
                // Add event listeners
                const editButton = activityElement.querySelector('.edit-activity');
                const deleteButton = activityElement.querySelector('.delete-activity');
                
                editButton.addEventListener('click', () => this.editActivity(activity.id));
                deleteButton.addEventListener('click', () => this.deleteActivity(activity.id));
                
                // Add to list
                this.activitiesList.appendChild(activityElement);
            });
            
        } catch (error) {
            console.error('Error refreshing activity list:', error);
            this.activitiesList.innerHTML = '<p>Error loading activities. See console for details.</p>';
        }
    }    
    // Edit an activity
    async editActivity(id) {
        try {
            // Get the activity
            const activity = await db.getItem('activities', id);
            
            if (!activity) {
                alert('Activity not found.');
                return;
            }
            
            // Set current activity ID
            this.currentActivityId = id;
            
            // Fill form with activity data
            this.activityDescription.value = activity.description;
            
            // Format dates for the form
            const startTime = new Date(activity.startTime);
            const endTime = new Date(activity.endTime);
            
            const startLocalDatetime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            
            const endLocalDatetime = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            
            this.activityStart.value = startLocalDatetime;
            this.activityEnd.value = endLocalDatetime;
            this.activityCategory.value = activity.categoryId;
            
            // Get tags
            if (activity.tags && Array.isArray(activity.tags)) {
                const tags = await db.getAll('tags');
                const tagMap = {};
                tags.forEach(tag => {
                    tagMap[tag.id] = tag;
                });
                
                const tagNames = activity.tags
                    .map(tagId => tagMap[tagId] ? tagMap[tagId].name : '')
                    .filter(Boolean);
                
                this.activityTags.value = tagNames.join(', ');
            } else {
                this.activityTags.value = '';
            }
            
            // Scroll to form
            this.activityForm.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error editing activity:', error);
            alert('Error editing activity. See console for details.');
        }
    }
    
    // Delete an activity
    async deleteActivity(id) {
        try {
            // Confirm deletion
            const confirm = window.confirm('Are you sure you want to delete this activity?');
            
            if (!confirm) return;
            
            // Delete the activity
            await db.deleteItem('activities', id);
            
            // Refresh activity list
            await this.refreshActivityList();
            
            // Update visualizations
            await visualizations.updateAllCharts();
            
        } catch (error) {
            console.error('Error deleting activity:', error);
            alert('Error deleting activity. See console for details.');
        }
    }
}

// Create and initialize application
const app = new TimeTrackerApp();

// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', async () => {
    await app.initialize();
});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service worker registered:', registration);
            })
            .catch(error => {
                console.error('Service worker registration failed:', error);
            });
    });
}
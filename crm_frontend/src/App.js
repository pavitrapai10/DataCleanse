import React, { useState, useEffect, useRef,useCallback ,useMemo} from 'react';
import { AgGridReact } from 'ag-grid-react';
import HoverDeleteCellRenderer from './buttons/delete';
import MaximizeButtonCellRenderer from './MaximizeButtonCellRenderer';
import './App.css';
import { Dropdown } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import Overlay from './overlays/Overlay';
import FilterInput from './filterInput';
import { themeBalham } from 'ag-grid-community';

// Import AG Grid Community modules
import { 
  ModuleRegistry, 
  ClientSideRowModelModule,
  ValidationModule,
  NumberFilterModule,
  RowSelectionModule,
  HighlightChangesModule,
  CellStyleModule,
  TextEditorModule,
  EventApiModule,
  SelectEditorModule,
  DateFilterModule,
  TextFilterModule,
  CheckboxEditorModule,
  ColumnApiModule,
  NumberEditorModule,
  DateEditorModule,
  RowApiModule,
  PaginationModule,
  RenderApiModule
} from 'ag-grid-community';

// Import AG Grid Enterprise modules
import {
  CellSelectionModule,
  ClipboardModule,
  ColumnMenuModule,
  ContextMenuModule,
  ExcelExportModule,
  IntegratedChartsModule,
  RowGroupingModule,
  ColumnsToolPanelModule,
  PivotModule,
  SetFilterModule,
  RowGroupingPanelModule, 
  QuickFilterModule,
  FiltersToolPanelModule
} from "ag-grid-enterprise";

// Import AG Charts Enterprise module
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import { LicenseManager } from "ag-grid-enterprise";

// Register all AG Grid modules
ModuleRegistry.registerModules([
  // Community modules
  ClientSideRowModelModule,
  ValidationModule,
  NumberFilterModule,
  RowSelectionModule,
  HighlightChangesModule,
  CellStyleModule,
  TextEditorModule,
  EventApiModule,
  SelectEditorModule,
  RenderApiModule,
  DateFilterModule,
  TextFilterModule,
  CheckboxEditorModule,
  ColumnApiModule,
  NumberEditorModule,
  DateEditorModule,
  RowApiModule,
  PaginationModule,
  FiltersToolPanelModule,
  // Enterprise modules
  ClipboardModule,
  ExcelExportModule,
  ColumnMenuModule,
  ContextMenuModule,
  CellSelectionModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
  RowGroupingModule,
  ColumnsToolPanelModule,
  PivotModule,
  SetFilterModule,
  RowGroupingPanelModule, 
  QuickFilterModule
]);


LicenseManager.setLicenseKey('[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-078794}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{14 April 2025}____[v3]_[0102]_MTc0NDU4NTIwMDAwMA==0e65fd8a353058a58afb8d7be064e726');



const App = () => {
  const initialTabs = ['Lead', 'Account', 'Opportunity', 'Contact'];

  const loadSavedTabs = () => {
    const savedTabs = localStorage.getItem('tabs');
    return savedTabs ? JSON.parse(savedTabs) : initialTabs;
  };
  const [activeTab, setActiveTab] = useState('Lead');
  const [gridData, setGridData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [tabs, setTabs] = useState(loadSavedTabs());
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const gridApiRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
const [selectedFields, setSelectedFields] = useState([]);
  const [columnDefs, setColumnDefs] = useState({});
  const [filterQuery, setFilterQuery] = useState('');
  const [gridApi, setGridApi] = useState(null);
  const [filterModel, setFilterModel] = useState({});
  const [complexTabData, setComplexTabData] = useState(null);
const [visibleColumns, setVisibleColumns] = useState(
  () => Object.fromEntries(selectedFields.map(field => [field, true]))
);


  const [complexData, setComplexData] = useState(null);
  const [loadingCell, setLoadingCell] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  const [show, setShow] = useState(false);
  const dropdownRef = useRef(null);
  const myTheme = themeBalham.withParams({ accentColor: 'red' });
  const handleToggle = (isOpen) => {
    setShow(isOpen);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShow(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Closed', label: 'Closed' },
  ];
  const context = {
    loadingCell,
    setLoadingCell,
  };

  useEffect(() => {
    const fetchAvailableFields = async () => {
      try {
        // Check if data is in local storage
        const cachedData = localStorage.getItem('availableFields');
        if (cachedData) {
          const data = JSON.parse(cachedData);
          const fields = data[activeTab] || [];
          setAvailableFields(fields);
          setSelectedFields(fields);
          return;
        }
  
        // If not in local storage, make the POST request
        const response = await fetch('http://127.0.0.1:8000/salesforce/fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body for POST request
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch available fields');
        }
  
        const data = await response.json();
        // Store the fetched data in local storage
        localStorage.setItem('availableFields', JSON.stringify(data));
  
        // Extract fields for the active tab
        const fields = data[activeTab] || [];
        setAvailableFields(fields);
        setSelectedFields(fields);
      } catch (error) {
        console.error('Error fetching available fields:', error);
        // Handle error cases, e.g., set a default value for availableFields
      }
    };
  
    fetchAvailableFields();
  }, [activeTab]);

  useEffect(() => {
    if (availableFields.length > 0) {
      setSelectedFields(availableFields);
    }
  }, [availableFields]);

useEffect(() => {
  setVisibleColumns(Object.fromEntries(selectedFields.map(field => [field, true])));
}, [selectedFields]);

useEffect(() => {
  const saveVisibleColumnsState = () => {
    const visibleColumnsState = { ...visibleColumns };
    localStorage.setItem(`visibleColumns_${activeTab}`, JSON.stringify(visibleColumnsState));
  };

  saveVisibleColumnsState();
}, [visibleColumns, activeTab]);


const handleFieldSelection = (field) => {
  // Update the selected fields state
  setSelectedFields(prevFields =>
    prevFields.includes(field)
      ? prevFields.filter(f => f !== field)
      : [...prevFields, field]
  );


  // Update the visibleColumns state
  setVisibleColumns(prevState => {
    const newVisibleState = { ...prevState };
    newVisibleState[field] = !newVisibleState[field];
    return newVisibleState;
  });
  // Update the visibility of the column in the grid
  gridApi.setColumnVisible(field, !visibleColumns[field]);


};


const handleTabChange = (tab) => {
  console.log('Switching to tab:', tab);
  setActiveTab(tab);

  const savedVisibleColumns = localStorage.getItem(`visibleColumns_${tab}`);
  if (savedVisibleColumns) {
    const visibleColumnsState = JSON.parse(savedVisibleColumns);
    setVisibleColumns(visibleColumnsState);
    if (gridApi && gridApi.columnApi) {
      // Ensure that all columns are set to the correct visibility state
      gridApi.columnApi.getAllColumns().forEach((col) => {
        const field = col.getColId();
        const isVisible = visibleColumnsState[field] !== undefined ? visibleColumnsState[field] : true;
        gridApi.columnApi.setColumnVisible(field, isVisible);
      });
    }
  } else {
    setSelectedFields([]);
    setVisibleColumns({});
  }

  fetchData(tab);
};


  const onPaginationChanged = (params) => {
    if (params.newPage) {
      setCurrentPage(params.newPage);
    }
  };
  
  const onPageSizeChanged = (params) => {
    fetchData(activeTab, currentPage, params.newPageSize);
  };

  const fetchData = async (tab, page = 0, pageSize = 10) => {
    setIsLoading(true);
    try {
      // Check if data for the tab exists in local storage
      //const storedGridData = localStorage.getItem('gridData');
      //let gridData = storedGridData ? JSON.parse(storedGridData) : {};
  
      if (gridData[tab.toLowerCase()]) {
        // If data for the tab is found in local storage, use it
        setGridData(gridData);
        setIsLoading(false);
        return;
      }
  
      // If data for the tab is not found, make the POST request
      const response = await fetch('http://127.0.0.1:8000/salesforce/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ object: tab, page, pageSize }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const text = await response.text();
      let data;
  
      try {
        data = JSON.parse(text);
        console.log(data);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        data = [];
      }
  
      if (!Array.isArray(data[tab])) {
        console.error('Fetched data is not an array:', data);
        data = [];
      }
  
      const newGridData = {
        ...gridData,
        [tab.toLowerCase()]: data[tab],
      };
  
      setGridData(newGridData);
      //localStorage.setItem('gridData', JSON.stringify(newGridData));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewTab = (newTabName) => {
    if (newTabName && !tabs.includes(newTabName)) {
      if (tabs.length >= 6) {
        alert('Maximum of 6 tabs can be opened at once.');
        return;
      }
      const newTabs = [...tabs, newTabName];
      setTabs(newTabs);
      setActiveTab(newTabName);
      setSelectedOption(null); // Reset selected option after adding a new tab
      fetchData(newTabName);
    } else if (tabs.includes(newTabName)) {
      const newTabs = tabs.filter((tab) => tab !== newTabName);
      setTabs(newTabs);
      setActiveTab(newTabs[0] || 'Lead');
      setSelectedOption(null); // Reset selected option after removing a tab
    }
  };

  const handleCheckboxChange = (event) => {
    const tabName = event.target.name;
    if (event.target.checked) {
      addNewTab(tabName);
    } else {
      addNewTab(tabName);
    }
  };
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const onGridReady = (params) => {
    console.log('Grid is ready!');
    gridApiRef.current = params.api;

    params.api.addEventListener('cellEditingStarted', (event) => {
      const input = event.api.getCellEditorInstances()[0].getGui().querySelector('input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            event.api.stopEditing();
          }
        });
      }
    });
  };

  const handleMaximize = async (data) => {
    const { id } = data;
  
    try {
      const response = await fetch('http://127.0.0.1:8000/overlay/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({"id": data.Id }),
      });
  console.log({"id": data.Id } , "OVERLAY INPUT")
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
  
      const result = await response.json();
      setOverlayData(result);
      setShowOverlay(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error
    }  console.log()
  };
  
  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setOverlayData(null);
  };

  const handleSaveOverlayData = (updatedCellData) => {
    const { id, data: updatedFields } = updatedCellData;
    const updatedRow = { ...overlayData, ...updatedFields };

    const newGridData = {
      ...gridData,
      [activeTab.toLowerCase()]: gridData[activeTab.toLowerCase()].map((item) =>
        item.id === id ? updatedRow : item
      ),
    };

    setGridData(newGridData);
    //localStorage.setItem('gridData', JSON.stringify(newGridData));

   // saveDataToServer(activeTab, id, updatedFields);

    gridApiRef.current.applyTransaction({ update: [updatedRow] });

    handleCloseOverlay();
  };

  const handleCellDoubleClicked = (params) => {
    const { event } = params;
    const cellRect = event.target.getBoundingClientRect();
    setPopupPosition({ top: cellRect.top + window.scrollY, left: cellRect.left + window.scrollX });
    setShowPopup(true);
  };

  const getColumnDefs = () => {
    if (columnDefs[activeTab.toLowerCase()]) {
      return columnDefs[activeTab.toLowerCase()];
    }
  
    // const statusColumnDef = {
    //   field: 'status',
    //   headerName: 'Status',
    //   editable: true,
    //   cellEditor: 'agSelectCellEditor',
    //   cellEditorParams: {
    //     values: statusOptions.map(option => option.value),
    //   },
    //   hide: !visibleColumns.status,
    //   filter: true
    // };
  
    const actionColumnDef = {
      headerName: ' ',
      field: 'actions',
      cellRenderer: (params) => <MaximizeButtonCellRenderer data={params.data} onMaximize={handleMaximize} />,
      pinned: 'left',
      width: 50
    };
  
    const allFields = requiredFields[activeTab].concat(selectedFields);
  
    const checkboxColumnDef = {
      headerCheckboxSelection: showCheckboxes,
      checkboxSelection: showCheckboxes,
      width: showCheckboxes ? 60 : 0,
      hide: !showCheckboxes,
    };
  
    const columnDefsForTab = allFields.map(field => ({
      field: field,
      editable: true,
      filter: true,
      cellRenderer: (props) => <HoverDeleteCellRenderer {...props} objectType={activeTab} />,
      cellRenderer: EditCellRenderer,
      hide: !visibleColumns[field],
      enableRowGroup: true,
    }));
  
    return [checkboxColumnDef, ...columnDefsForTab,  actionColumnDef];
  };

  const requiredFields = {
    Lead: [],
    Account: [],
    Opportunity: [],
    Contact: [],
    Task: [],
    Event: [],

    // Lead: ['Id','FirstName','LastName','Company','State','Title','Status','Title','Industry','NumberOfEmployees','Phone','Email'],
    // Account: ['Name','NumberOfEmployees','AnnualRevenue','Type','Industry','BillingState'],
    // Opportunity: ['Name', 'StageName', 'CloseDate', 'Amount','Type','NextStep','ForecastCategory','LastModifiedDate'],
    // Contact: ['FirstName','LastName','Title','Phone','MobilePhone','Email','MailingState',],
    // Task: ['Subject','Status','ActivityDate','Status','Priority','Description','CreatedDate','LastModifiedDate'],
    // Event: ['Event'],
  };

  const gridOptions = {
    // Enable Row Grouping feature
    groupDefaultExpanded: 1, // Expand first level by default
    autoGroupColumnDef: {
      headerName: 'Group',
      minWidth: 200,
      cellRendererParams: {
        suppressCount: false, // Show count of items in group
        checkbox: true // Enable checkbox selection in groups
      }
    },
    // Other grid options you might need
    rowGroupPanelShow: 'always', // 'always', 'onlyWhenGrouping', or 'never'
    groupSelectsChildren: true, // When you select a group, all children get selected
    groupIncludeFooter: true, // Include a footer with aggregated values for each group
    groupIncludeTotalFooter: true // Include a grand total footer
  };

  const addNewRow = async () => {
    const dummyData = {
      Lead: {
        FirstName: 'Jane',
        LastName: 'Doe',
        Company: 'ExampleCorp2'
      },
      Account: {
        Name: 'ExampleAccount'
      },
      Opportunity: {
        Name: 'ExampleOpportunity',
        StageName: 'Prospecting',
        CloseDate: '2024-12-31',
        Amount: 1000
      },
      Contact: {
        LastName: 'addrowTesting'
      },
      Task: {
        Status: 'Not Started'
      },
      Event: {
        Event: 'DummyEVENT'
      }
    };
  
    const newRow = {
      ...dummyData[activeTab]
    };
  
    // Insert the new row at the beginning of the updatedData array
    const updatedData = [newRow, ...(gridData[activeTab.toLowerCase()] || [])];
  
    // Optimistically update the grid data with the new row
    setGridData(prevGridData => ({
      ...prevGridData,
      [activeTab.toLowerCase()]: updatedData,
    }));
  
    try {
      const payload = {
        object: activeTab,
        operation: 'create',
        data: newRow,
      };
  
      const response = await fetch('http://127.0.0.1:8000/salesforce/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save new row');
      }
  
      const result = await response.json();
      console.log('New row saved successfully:', result);
  
      if (result.id) {
        const newRowWithId = { ...newRow, id: result.id };
  
        // Update the state with the new ID
        setGridData(prevGridData => ({
          ...prevGridData,
          [activeTab.toLowerCase()]: prevGridData[activeTab.toLowerCase()].map(item => 
            item === newRow ? newRowWithId : item
          ),
        }));
  
        // Use the grid API to update the row with the new ID
        gridApiRef.current.applyTransaction({ update: [newRowWithId] });
      }
  
    } catch (error) {
      console.error('Error saving new row:', error);
      // Optionally, revert the optimistic update here if needed
    }
  };
  

  const onCellEditingStarted = useCallback(() => {
    setLoadingCell(null);
    console.log("-----------edit started");
  }, []);
  
  const onCellEditingStopped = useCallback(async (event) => {
    console.log("-----------edit done");
    const { data, colDef, newValue, oldValue } = event;
    const rowId = data.Id; // Assume `data.Id` is the correct identifier for the row
  
    // Ensure colDef, newValue, and oldValue are present
    if (!colDef || newValue === undefined || oldValue === undefined) {
      console.error('Cell Value not changed', event);
      return;
    }
  
    // Check if the value actually changed
    if (newValue === oldValue) {
      console.log('Value did not change, no update needed');
      return;
    }
  
    if (loadingCell && loadingCell.id === rowId && loadingCell.col === colDef.field) {
      // Cell is already being edited, ignore this event
      return;
    }
  
    setLoadingCell({ id: rowId, col: colDef.field, status: 'loading' });
  
    try {
      await onCellValueChanged({ data, colDef, newValue, oldValue });
      setLoadingCell({ id: rowId, col: colDef.field, status: 'success' });
  
      setTimeout(() => {
        setLoadingCell(null);
      }, 2000);
    } catch (error) {
      console.error("API call failed", error);
      setLoadingCell({ id: rowId, col: colDef.field, status: 'error' });
    }
  }, [loadingCell]);
  
  const onCellValueChanged = async (params) => {
    const { data, colDef, newValue, oldValue } = params;
  
    // Check if the value actually changed
    if (newValue === oldValue) {
      console.log('Value did not change, no update needed');
      return;
    }
  
    const field = colDef.field;
    const selectedRows = gridApiRef.current.getSelectedRows();
  
    if (selectedRows.length > 1) {
      const ids = selectedRows.map(row => row.Id);
  
      selectedRows.forEach(row => {
        row[field] = newValue;
      });
  
      setGridData(prevData => ({
        ...prevData,
        [activeTab.toLowerCase()]: [...prevData[activeTab.toLowerCase()]]
      }));
  
      console.log('Bulk Update:', { ids, field, newValue });
  
      try {
        const payloads = {
          object: activeTab,
          id: ids,
          field,
          value: newValue
        };
  
        const response = await fetch('http://127.0.0.1:8000/salesforce/bulk_update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloads)
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        console.error('There was a problem with the bulk update fetch operation:', error);
      }
    } else if (selectedRows.length === 1) {
      const id = selectedRows[0].Id;
      console.log('Update:', { id, field, newValue });
  
      try {
        const payload = {
          object: activeTab,
          id: id,
          field: field,
          value: newValue
        };
  
        const response = await fetch('http://127.0.0.1:8000/salesforce/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        console.error('There was a problem with the single update fetch operation:', error);
      }
    } else {
      console.error('No rows selected for update');
    }
  };


const handleBulkDelete = async () => {
  const selectedNodes = gridApiRef.current.getSelectedNodes();
  if (!selectedNodes || selectedNodes.length === 0) {
    console.error('No rows selected for deletion');
    return;
  }

  const selectedData = selectedNodes.map(node => node.data);
  if (!selectedData || selectedData.length === 0) {
    console.error('No data found for selected rows');
    return;
  }

  console.log('Data to delete:', selectedData);

  const newGridData = {
    ...gridData,
    [activeTab.toLowerCase()]: gridData[activeTab.toLowerCase()].filter(item => !selectedData.includes(item)),
  };

  setGridData(newGridData);
  // localStorage.setItem('gridData', JSON.stringify(newGridData));

  try {
    const payload = {
      object: activeTab,
      operation: 'bulk_delete',
      id: selectedData.map(row => row.Id),
    };

    const response = await fetch('http://127.0.0.1:8000/salesforce/bulk_delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to delete rows');
    }

    const result = await response.json();
    console.log('Rows deleted successfully:', result);

    setTimeout(() => {
      gridApiRef.current.applyTransaction({ remove: selectedData });
    }, 0);
  } catch (error) {
    console.error('Error deleting rows:', error);
  }
};

const clearAllFilters = () => {
  if (gridApi) {
    gridApi.setFilterModel({}); // Clear all filters
  }
};

const clearFiltersCallback = () => {
  clearAllFilters();
};


const onFilterQueryChange = (event) => {
  setFilterQuery(event.target.value);
};

const switchTab = (tabName, callback) => {
  setActiveTab(tabName);
  console.log(`Switched to tab: ${tabName}`);
  if (callback) {
    callback();
  }
};

const parseFilterQuery = (query) => {
  const filterMappings = {
    "Lead living in CA": { tab: "Lead", filter: { State: { filterType: 'text', type: 'equals', filter: 'CA' } } },
    "Account in NY": { tab: "Account", filter: { BillingState: { filterType: 'text', type: 'equals', filter: 'NY' } } },
    "Opportunity of 15000": { tab: "Opportunity", filter: { Amount: { filterType: 'text', type: 'equals', filter: '15000' } } },
    "All Pending Task": { tab: "Task", filter: { Status: { filterType: 'text', type: 'equals', filter:'Pending' } } },
    "Contact called Rogers": { tab: "Contact", filter: { Name: { filterType: 'text', type: 'contains', filter: 'Rogers' } } },
    "Lead living in PA": { tab: "Lead", filter: { State: { filterType: 'text', type: 'equals', filter: 'PA' } } },
    // Add more mappings as needed
  };
  return filterMappings[query] || { tab: "", filter: {} };
};

const onSubmitFilter = () => {
  try {
    if (gridApi && filterQuery.trim() !== '') {
      const { tab, filter } = parseFilterQuery(filterQuery);

      if (tab) {
        switchTab(tab, () => {
          console.log("--------------------", filter);
          // Apply the filter model after a delay to ensure columnDefs are ready
          setTimeout(() => {
            setFilterModel(filter);
          }, 500); // 500ms delay, adjust as necessary
        });
      } else {
        console.error('No matching tab or filter found for the query.');
      }
    }
  } catch (error) {
    console.error('Error submitting filter:', error);
  }
};

useEffect(() => {
  if (gridApi && Object.keys(filterModel).length > 0) {
    gridApi.setFilterModel(filterModel);
  }
}, [filterModel, gridApi]);
const newTab = "Query1";
requiredFields[newTab] = [];

const autoGroupColumnDef = useMemo(() => ({
  headerName: 'StageName',
  minWidth: 200,
  cellRendererParams: {
    suppressCount: false, // Set to true if you don't want to show count
    innerRenderer: (params) => {
      return params.value;
    }
  }
}), []);
// Add a new tab and set it as active
const addComplexTab = (newTabName) => {
  if (!tabs.includes(newTabName)) {
    if (tabs.length >= 6) {
      alert("Maximum of 6 tabs can be opened at once.");
      return;
    }
    const newTabs = [...tabs, newTabName];
    setTabs(newTabs);
    setActiveTab(newTabName);
  }
};

// Populate grid data dynamically
const populateComplexTab = (data) => {
  setGridData((prevData) => ({
    ...prevData,
    [newTab.toLowerCase()]: data,
  }));
  setColumnDefs((prevDefs) => ({
    ...prevDefs,
    [newTab.toLowerCase()]: Object.keys(data[0]).map((field) => ({
      field,
      editable: true,
      filter: true,
      floatingFilter: true,
    })),
  }));
};

// Handle complex input
const handleFilterQueryChange = (event) => {
  const value = event.target.value;
  setFilterQuery(value);

  if (value.trim().toLowerCase() === "complex") {
    addComplexTab(newTab);
    const complexData = [
      { field1: "value1", field2: "value2" },
      { field1: "value3", field2: "value4" },
    ];
    populateComplexTab(complexData);
  }
};

const onSearchTextChange = (event) => {
  const searchText = event.target.value.toString().toLowerCase();
  setSearchText(searchText);
  if (gridApi) {
    const searchTerms = searchText.split(',')
      .map(term => term.trim())
      .filter(term => term.length >= 1); // Only keep terms with at least 2 characters
    
    if (searchTerms.length > 0) {
      const quickFilterText = searchTerms.join(' ');
      // Fixed method: use setGridOption instead of setQuickFilter
      gridApi.setGridOption("quickFilterText", quickFilterText);
      
      const newVisibleColumns = { ...visibleColumns };
      const newSelectedFields = [...selectedFields];
       
      availableFields.forEach((field) => {
        let columnContainsSearchTerm = false;
        gridApi.forEachNode((node) => {
          if (!node.data || !field) return; // Add null check as in working code
          const cellData = node.data[field] ? node.data[field].toString().toLowerCase() : '';
          
          if (searchTerms.some(term => cellData.includes(term))) {
            columnContainsSearchTerm = true;
          }
        });
        
      });
      
      setVisibleColumns(newVisibleColumns);
      setSelectedFields(newSelectedFields);
      syncDropdownStateWithColumnVisibility();
    } else {
      // Fixed method: use setGridOption instead of setQuickFilter
      gridApi.setGridOption("quickFilterText", "");
    }
    
    syncDropdownStateWithColumnVisibility();
  }
  
  // Removed problematic toggle section
};
const syncDropdownStateWithColumnVisibility = () => {
  const columnState = gridApi.getColumnState();
  const updatedDropdownOptions = columnState.map(col => ({
    value: col.colId,
    checked: !col.hide
  }));
  setDropdownOptions(updatedDropdownOptions);
  //console.log(updatedDropdownOptions,"SYNC")

  const updatedVisibleColumns = {};
  columnState.forEach(col => {
    updatedVisibleColumns[col.colId] = !col.hide;
  });
  setVisibleColumns(updatedVisibleColumns);
  //console.log(updatedVisibleColumns,"UPDATED VISIBLE COLS")
};


// };
const handleColumnToggle = (column) => {
  setVisibleColumns(prevState => {
    const newVisibleState = { ...prevState };
    newVisibleState[column] = !newVisibleState[column];
    return newVisibleState;
  });

  gridApi.setColumnVisible(column, !visibleColumns[column]);
};

const toggleCheckboxes = () => {
  setShowCheckboxes(!showCheckboxes);
};

  return (
    <div className="main-container">
    <div>
    {/* <FilterInput
                filterQuery={filterQuery}
                handleFilterQueryChange={handleFilterQueryChange}
                onSubmitFilter={onSubmitFilter}
                setFilterQuery={setFilterQuery}
                onClearFilters={clearFiltersCallback}
            /> */}
    </div>

        <div
            style={{
                backgroundColor: "rgb(250, 215, 215)",
                padding: "10px",
                
            }}
        >
        <div className="pink-line"></div>
        <div className="tab-container">
        {tabs.map((tab) => (
          <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
          >
              {tab}
          </button>
      ))}
      <Dropdown onSelect={addNewTab}>
      <Dropdown.Toggle variant="grey" id="dropdown-basic" className="grey-button tab-button">
        ➕
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {['Lead', 'Account', 'Opportunity', 'Contact', 'Task', 'Event'].map((option) => (
          <Dropdown.Item key={option} eventKey={option}>
            <input
              type="checkbox"
              name={option}
              checked={tabs.includes(option)}
              onChange={handleCheckboxChange}
              className="custom-checkbox"
              id={`checkbox-${option}`}
            />
            {option}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
<div className="left-controls">

      
          <div className="search-container">
        <input className='search-input'
            type="text"
            placeholder="Filter..."
            value={searchText}
            onChange={onSearchTextChange}
        />
      </div>        
<div className="field-selection">
{/* <div ref={dropdownRef}>
      <Dropdown show={show} onToggle={handleToggle}>
        <Dropdown.Toggle variant="grey" id="dropdown-basic" className="grey-button tab-button">
          Columns
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {availableFields.map((field, index) => (
            <Dropdown.Item key={index} as="div" onClick={(e) => e.stopPropagation()}>
              <Form.Check 
                type="checkbox"
                id={`checkbox-${index}`}
                label={field}
                checked={selectedFields.includes(field)}
                onChange={() => handleFieldSelection(field)}
                onMouseDown={(e) => e.preventDefault()} // Prevent default dropdown behavior
              />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div> */}


    </div>
    <button onClick={addNewRow} class='grey-button'> ➕ Add Row </button>
    <button onClick={handleBulkDelete} class='grey-button' > ✖️ Delete</button>
    <button onClick={toggleCheckboxes}>{showCheckboxes ? '☑️ Select' : '⬜️ Select'}</button>

</div>
    </div>
            <div className="grid-container">
                <div className="ag-theme-quartz" style={{ height: "100%", width: "100%", margin: "auto" }}>
                    {isLoading ? (
                        <div className="loading-container">
                            <img src="/buffering.gif" alt="Loading..." className="loading-spinner" />
                        </div>
                    ) : (
                        <AgGridReact
                            onGridReady={params => {
                                setGridApi(params.api);
                                if (onGridReady) {
                                    onGridReady(params);
                                }
                            }}
                            rowSelection={{ type: 'multiple' }} // Fixed: using object notation
                            cellSelection={true} // Fixed: using cellSelection instead of enableRangeSelection
                            enableCharts={true}
                            rowGroupPanelShow="always" // Shows the grouping panel at the top ('always', 'onlyWhenGrouping', or 'never')
                    groupDisplayType="groupRows" // or 'multipleColumns' for column groups
                    suppressGroupDefaultExpand={false} // Set to true to collapse groups by default
                    groupDefaultExpanded={1} // Number of levels to expand by default (0 = none, 1 = first level, etc.)
                    sideBar={"columns"}
                    
                            animateRows={true}
                            suppressAggFuncInHeader={true}
                            enableCellTextSelection={true}
                            ensureDomOrder={true}
                            allowContextMenuWithControlKey={true}
                            suppressContextMenu={false}
                      
                            pivotPanelShow="always"
                            theme={myTheme}
                            autoGroupColumnDef={autoGroupColumnDef}
                            rowData={gridData[activeTab.toLowerCase()]}
                            columnDefs={getColumnDefs()}
                            onCellDoubleClicked={handleCellDoubleClicked}
                            onCellValueChanged={onCellValueChanged}
                            singleClickEdit={false}
                            stopEditingWhenCellsLoseFocus={true}
                            pagination={true}
                            context={context}
                            paginationPageSize={50}
                            onPaginationChanged={onPaginationChanged}
                            //quickFilterText={quickFilterText}
                            onPageSizeChanged={onPageSizeChanged}
                            onCellEditingStarted={onCellEditingStarted}
                            onCellEditingStopped={onCellEditingStopped}
                        />
                    )}
                </div>

            </div>
        </div>
        {showPopup && (
          <div className="custom-popup" style={{ top: popupPosition.top, left: popupPosition.left }}>
          </div>
        )}
        {showOverlay && (
          <Overlay
            data={overlayData}
            objectType={activeTab}
            onClose={handleCloseOverlay}
            onSave={handleSaveOverlayData}
          />
        )}
      
    </div>

);
};
const EditCellRenderer = React.memo((props) => {
  // Destructure value from props first
  const { value, data, colDef } = props;
  const { loadingCell } = props.context;
  const rowId = data.Id; // Assume `data.Id` is the correct identifier for the row

  // --- START FIX ---
  let displayValue = value; // Default to the original value

  // Check if 'value' is an object, not null, and not already a React element
  if (value && typeof value === 'object' && !React.isValidElement(value)) {
    // Attempt to format address objects nicely
    if (value.street || value.city || value.state || value.postalCode || value.country) {
      // Join available parts, filtering out null/empty values
      displayValue = [
        value.street,
        value.city,
        value.state,
        value.postalCode,
        value.country,
      ]
        .filter(part => part) // Remove null/undefined/empty strings
        .join(', '); // Join with comma and space
    } else {
      // For other generic objects, fallback to JSON stringification
      try {
        displayValue = JSON.stringify(value);
      } catch (e) {
        console.error("Could not stringify object:", value, e);
        displayValue = '[Object]'; // Fallback string
      }
    }
  }
  // Ensure null/undefined are displayed as empty strings
  else if (value === null || typeof value === 'undefined') {
    displayValue = '';
  }

  // Use displayValue for rendering
  let cellContent = <span>{displayValue}</span>; // Initial render state

  if (loadingCell && loadingCell.id === rowId && loadingCell.col === colDef.field) {
    const iconSrc =
      loadingCell.status === 'loading'
        ? `${process.env.PUBLIC_URL}/loading.gif`
        : loadingCell.status === 'success'
        ? `${process.env.PUBLIC_URL}/success.gif`
        : loadingCell.status === 'error'
        ? `${process.env.PUBLIC_URL}/error.gif`
        : null;

    const altText =
      loadingCell.status === 'loading'
        ? 'Loading'
        : loadingCell.status === 'success'
        ? 'Success'
        : loadingCell.status === 'error'
        ? 'Error'
        : '';

    if (iconSrc) {
       // Render value alongside the icon
       cellContent = (
         <div className="cell-content">
           <span>{displayValue}</span> {/* Use displayValue */}
           <img src={iconSrc} className="icon" alt={altText} />
         </div>
       );
    }
    // If no specific status, just show the value (handled by the initial cellContent assignment)

  }

  // Always return a valid React element (like a div wrapping the content)
  return <div>{cellContent}</div>;
});

export default App;

const getColumnDefs = () => {
  switch (activeTab) {
    case 'Leads':
      return [
        {
          headerName: 'Lead Info',
          children: [
            { field: 'name', editable: true, filter: true, floatingFilter: true },
            { field: 'email', editable: true, filter: true, floatingFilter: true },
            { field: 'phone', editable: true, filter: true, floatingFilter: true },
          ],
        },
      ];
    case 'Accounts':
      return [
        {
          headerName: 'Account Info',
          children: [
            { field: 'name', editable: true, filter: true, floatingFilter: true },
            { field: 'industry', editable: true, filter: true, floatingFilter: true },
            { field: 'location', editable: true, filter: true, floatingFilter: true },
          ],
        },
      ];
    case 'Opportunities':
      return [
        {
          headerName: 'Opportunity Info',
          children: [
            { field: 'name', editable: true, filter: true, floatingFilter: true },
            { field: 'account', editable: true, filter: true, floatingFilter: true },
            { field: 'value', editable: true, filter: true, floatingFilter: true },
          ],
        },
      ];
    case 'Comments':
      return [
        {
          headerName: 'Comment Info',
          children: [
            { field: 'postId', editable: true, filter: true, floatingFilter: true },
            { field: 'id', editable: true, filter: true, floatingFilter: true },
            { field: 'email', editable: true, filter: true, floatingFilter: true },
            { field: 'name', editable: true, filter: true, floatingFilter: true },
            { field: 'body', editable: true, filter: true, floatingFilter: true },
          ],
        },
      ];
    default:
      return [];
  }
};
        <div>
        <FilterInput></FilterInput>
        <div className="filter-container">
            <input
                type="text"
                value={filterQuery}
                onChange={handleFilterQueryChange}
            />
            <button onClick={onSubmitFilter}>Submit Filter</button>
        </div>
        </div>
(function(root) {
  window.shared || (window.shared = {});
  const Cookies = window.Cookies;

  window.shared.HomeroomTable = React.createClass({
    displayName: 'HomeroomTable',

    propTypes: {
      showStar: React.PropTypes.bool.isRequired,
      showMcas: React.PropTypes.bool.isRequired,
      rows: React.PropTypes.array.isRequired
    },

    getInitialState () {
      const initialColumns = this.getInitialColumnsDisplayed();

      return {
        columnsDisplayed: initialColumns,
        showColumnPicker: false,
        sortBy: 'first_name',
        sortType: 'string',
        sortDesc: true
      };
    },

    onClickHeader (sortBy, sortType) {
      if (sortBy === this.state.sortBy) {
        this.setState({ sortDesc: !this.state.sortDesc });
      } else {
        this.setState({ sortBy: sortBy, sortType: sortType });
      }
    },

    sortByNumber (a, b, sortBy) {
      const numA = parseInt(a[sortBy]);
      const numB = parseInt(b[sortBy]);

      if (!Number.isInteger(numA) && !Number.isInteger(numB)) return 0;

      if (!Number.isInteger(numA) || numA > numB) return -1;
      if (!Number.isInteger(numB) || numA < numB) return 1;

      return 0;
    },

    sortByString (a, b, sortBy) {
      const stringA = a[sortBy];
      const stringB = b[sortBy];

      if (!stringA && !stringB) return 0;

      if (!stringA) return -1;
      if (!stringB) return 1;

      if (stringA.toUpperCase() < stringB.toUpperCase()) return -1;
      if (stringA.toUpperCase() > stringB.toUpperCase()) return 1;

      return 0;
    },

    sortByCustomEnum (a, b, sortBy, customEnum) {
      const indexA = customEnum.indexOf(a[sortBy]);
      const indexB = customEnum.indexOf(b[sortBy]);

      if (indexA > indexB) return 1;
      if (indexB > indexA) return -1;
      return 0;
    },

    orderedStudents () {
      const sortedStudents = this.sortedStudents();

      if (!this.state.sortDesc) return sortedStudents.reverse();

      return sortedStudents;
    },

    sortedStudents () {
      const students = this.activeMergedStudentRows();
      const sortBy = this.state.sortBy;
      const sortType = this.state.sortType;
      let customEnum;

      switch(sortType) {
      case 'string':
        return students.sort((a, b) => this.sortByString(a, b, sortBy));
      case 'number':
        return students.sort((a, b) => this.sortByNumber(a, b, sortBy));
      case 'date':
        return students.sort((a, b) => this.sortByDate(a, b, sortBy));
      case 'free_reduced_lunch':
        return students.sort((a, b) => this.sortByString(a, b, sortBy));
      case 'grade':
        customEnum = ['PK', 'KF', '1', '2', '3', '4', '5', '6', '7', '8'];
        return students.sort((a, b) => this.sortByCustomEnum(a, b, sortBy, customEnum));
      case 'sped_level_of_need':
        customEnum = ['—', 'Low < 2', 'Low >= 2', 'Moderate', 'High'];
        return students.sort((a, b) => this.sortByCustomEnum(a, b, sortBy, customEnum));
      case 'limited_english_proficiency':
        customEnum = ['FLEP-Transitioning', 'FLEP', 'Fluent'];
        return students.sort((a, b) => this.sortByCustomEnum(a, b, sortBy, customEnum));
      case 'program_assigned':
        customEnum = ['Reg Ed', '2Way English', '2Way Spanish', 'Sp Ed'];
        return students.sort((a, b) => this.sortByCustomEnum(a, b, sortBy, customEnum));
      case 'active_services':
        return students.sort((a, b) => this.sortByActiveServices(a, b));
      default:
        return students;
      }
    },

    columnKeysToNames () {
      return {
        'risk': 'Risk',
        'program': 'Program',
        'sped': 'SPED & Disability',
        'language': 'Language',
        'free-reduced': 'Free/Reduced Lunch',
        'star': 'STAR',
        'mcas': 'MCAS',
      };
    },

    columnKeys () {
      return Object.keys(this.columnKeysToNames());
    },

    columnNames () {
      return Object.values(this.columnKeysToNames());
    },

    getInitialColumnsDisplayed () {
      return (
        Cookies.getJSON("columnsDisplayed") || this.columnKeys()
      );
    },

    activeStudentRowFilter (row) {
      return row.enrollment_status === 'Active';
    },

    activeStudentRows () {
      return this.props.rows.filter(this.activeStudentRowFilter);
    },

    mergeInStudentRiskLevel (row) {
      let risk = { risk: row['student_risk_level']['level'] };
      let sped_level = { sped_level: row['sped_data']['sped_level'] };

      return { ...row, ...risk, ...sped_level };
    },

    activeMergedStudentRows () {
      return this.activeStudentRows().map(this.mergeInStudentRiskLevel);
    },

    warningBubbleClassName (row) {
      const riskLevel = row['student_risk_level']['level'] || 'na';

      return `warning-bubble risk-${riskLevel} tooltip`;
    },

    showStar () {
      const columnsDisplayed = this.state.columnsDisplayed;
      const starDisplayed = columnsDisplayed.indexOf('star') > -1;

      if (this.props.showStar === true && starDisplayed === true) return true;

      return false;
    },

    showMcas () {
      const columnsDisplayed = this.state.columnsDisplayed;
      const mcasDisplayed = columnsDisplayed.indexOf('mcas') > -1;

      if (this.props.showMcas === true && mcasDisplayed === true) return true;

      return false;
    },

    render () {
      return (
        <div id="roster-table-wrapper">
          {this.renderColumnPickerArea()}
          <table id="roster-table" cellSpacing="0" cellPadding="10" className="sort-default">
            {this.renderHeaders()}
            {this.renderRows()}
          </table>
        </div>
      );
    },

    renderStarHeaders () {
      return (
      [
        <td colSpan="1" key="star_math_header">
            <p className="smalltype">
              STAR: Math
            </p>
          </td>,
        <td colSpan="1" key="star_reading_header">
            <p className="smalltype">
              STAR: Reading
            </p>
          </td>
      ]
      );
    },

    renderStarSubHeaders () {
      return (
      [
        <th key="star_math_sub_header">
            <span className="table-header">Percentile</span>
          </th>,
        <th key="star_reading_sub_header">
            <span className="table-header">Percentile</span>
          </th>
      ]
      );
    },

    renderMcasHeaders () {
      return (
      [
        <td colSpan="2" key="mcas_math_header">
            <p className="smalltype">
              MCAS: Math
            </p>
          </td>,
        <td colSpan="2" key="mcas_ela_header">
            <p className="smalltype">
              MCAS: ELA
            </p>
          </td>
      ]
      );
    },

    renderMcasSubHeaders () {
      return (
      [
        <th key="mcas_math_sub_header_perf">
            <span className="table-header">Performance</span>
          </th>,
        <th key="mcas_math_sub_header_score">
            <span className="table-header">Score</span>
          </th>,
        <th key="mcas_ela_sub_header_perf">
            <span className="table-header">Performance</span>
          </th>,
        <th key="mcas_ela_sub_header_score">
            <span className="table-header">Score</span>
          </th>
      ]
      );
    },

    renderStarData (row) {
      if (!this.showStar()) return null;

      return (
      [
        <td key="star_math_percentile_rank">
            {row['most_recent_star_math_percentile']}
          </td>,
        <td key="star_reading_percentile_rank">
            {row['most_recent_star_reading_percentile']}
          </td>
      ]
      );
    },

    renderMcasData (row) {
      if (!this.showMcas()) return null;

      return (
      [
        <td key="mcas_math_performance_level">
            {row['most_recent_mcas_math_performance']}
          </td>,
        <td key="mcas_math_scaled">
            {row['most_recent_mcas_math_scaled']}
          </td>,
        <td key="mcas_ela performance_level">
            {row['most_recent_mcas_ela_performance']}
          </td>,
        <td key="mcas_ela_scaled">
            {row['most_recent_mcas_ela_scaled']}
          </td>
      ]
      );
    },

    renderSubHeader (columnKey, label, sortBy, sortType) {
      const columnsDisplayed = this.state.columnsDisplayed;

      if (columnsDisplayed.indexOf(columnKey) === -1) return null;

      return (
        <th className="sortable_header"
            onClick={this.onClickHeader.bind(null, sortBy, sortType)}>
          <span className="table-header">{label}</span>
        </th>
      );
    },

    renderSuperHeader (columnKey, columnSpan, label) {
      const columnsDisplayed = this.state.columnsDisplayed;

      if (columnsDisplayed.indexOf(columnKey) === -1) return null;

      if (!label) return (
        <td colSpan={columnSpan}></td>
      );

      return (
        <td colSpan={columnSpan}>
          <p className="smalltype">
            {label}
          </p>
        </td>
      );
    },

    renderNameSubheader () {
      return (
        <th className="name sortable_header"
            onClick={this.onClickHeader.bind(null, 'first_name', 'string')}>
          <span className="table-header">
            Name
          </span>
        </th>
      );
    },

    renderSubHeaders () {
      return (
        <tr className="column-names">
          {/* COLUMN HEADERS */}
          {this.renderNameSubheader()}
          {this.renderSubHeader(
            'risk', 'Risk', 'risk', 'number'
          )}
          {this.renderSubHeader(
            'program', 'Program Assigned', 'program_assigned', 'program_assigned'
          )}
          {this.renderSubHeader(
            'sped', 'Disability', 'disability', 'string'
          )}
          {this.renderSubHeader(
            'sped', 'Level of Need', 'sped_level', 'number'
          )}
          {this.renderSubHeader(
            'sped', '504 Plan', 'plan_504', 'string'
          )}
          {this.renderSubHeader(
            'language', 'Fluency', 'limited_english_proficiency', 'limited_english_proficiency'
          )}
          {this.renderSubHeader(
            'language', 'Home Language', 'home_language', 'string'
          )}
          {this.renderSubHeader(
            'free-reduced', 'Free/Reduced Lunch', 'free_reduced_lunch', 'string'
          )}
          {(this.showStar()) ? this.renderStarSubHeaders() : null}
          {(this.showMcas()) ? this.renderMcasSubHeaders() : null}
        </tr>
      );
    },

    renderHeaders () {
      return (
        <thead>
          <tr className="column-groups">
            {/*  TOP-LEVEL COLUMN GROUPS */}
            <td colSpan="1"></td>
            {this.renderSuperHeader('risk', '1')}
            {this.renderSuperHeader('program', '1')}
            {this.renderSuperHeader('sped', '3', 'SPED & Disability')}
            {this.renderSuperHeader('language', '2', 'Language')}
            {this.renderSuperHeader('free-reduced', '1')}
            {(this.showStar()) ? this.renderStarHeaders() : null}
            {(this.showMcas()) ? this.renderMcasHeaders() : null}
          </tr>
          {this.renderSubHeaders()}
        </thead>
      );
    },

    renderDataCell (columnKey, data) {
      const columnsDisplayed = this.state.columnsDisplayed;

      if (columnsDisplayed.indexOf(columnKey) === -1) return null;

      return (
        <td>{data || '—'}</td>
      );
    },

    renderWarningBubble (row) {
      return (
        <div className={this.warningBubbleClassName(row)}>
          {row['student_risk_level']['level'] || 'N/A'}
          <span className="tooltiptext">
            {row['student_risk_level']['explanation']}
          </span>
        </div>
      );
    },

    renderDataWithSpedTooltip (row) {
      return (
        <div className={row['sped_data']['sped_bubble_class']}>
          {row['sped_data']['sped_level']}
          <span className="tooltiptext">
            {row['sped_data']['sped_tooltip_message']}
          </span>
        </div>
      );
    },

    visitStudentProfile (id) {
      window.location.href = `/students/${id}`;
    },

    renderRow (row) {
      const fullName = `${row['first_name']} ${row['last_name']}`;
      const id = row["id"];

      return (
        <tr className="student-row"
            onClick={this.visitStudentProfile.bind(null, id)}
            key={id}>
          <td className="name">{fullName}</td>
          {this.renderDataCell('risk', this.renderWarningBubble(row))}
          {this.renderDataCell('program', row['program_assigned'])}
          {this.renderDataCell('sped', row['disability'])}
          {this.renderDataCell('sped', this.renderDataWithSpedTooltip(row))}
          {this.renderDataCell('sped', row['plan_504'])}
          {this.renderDataCell('language', row['limited_english_proficiency'])}
          {this.renderDataCell('language', row['home_language'])}
          {this.renderDataCell('free-reduced', row['free_reduced_lunch'])}
          {this.renderStarData(row)}
          {this.renderMcasData(row)}
        </tr>
      );
    },

    renderRows () {
      if (!this.props.rows) return null;

      const activeStudentRows = this.orderedStudents();

      return (
        <tbody>
          {activeStudentRows.map(this.renderRow)}
        </tbody>
      );
    },

    renderMenu () {
      return (
        <svg width="24px" height="6px" viewBox="0 0 24 6" version="1.1" >
          <g id="Roster" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" >
            <g id="Roster---home---add-1" transform="translate(-930.000000, -416.000000)" fill="#555555">
              <g id="menu" transform="translate(930.000000, 416.000000)">
                <circle id="Oval-137" cx="3" cy="3" r="3"></circle>
                <path d="M12,6 C13.6568542,6 15,4.65685425 15,3 C15,1.34314575 13.6568542,0 12,0 C10.3431458,0 9,1.34314575 9,3 C9,4.65685425 10.3431458,6 12,6 Z" id="Oval-138"></path>
                <circle id="Oval-139" cx="21" cy="3" r="3"></circle>
              </g>
            </g>
          </g>
        </svg>
      );
    },

    openColumnPicker () {
      this.setState({ showColumnPicker: true });
    },

    closeColumnPicker () {
      this.setState({ showColumnPicker: false });
    },

    renderColumnPickerArea () {
      return (
        <div>
          <div onClick={this.openColumnPicker} id="column-picker-toggle">
            {this.renderMenu()}
          </div>
          {this.renderColumnPickerMenu()}
        </div>
      );
    },

    toggleColumn (columnKey) {
      const columnsDisplayed = Object.assign(this.state.columnsDisplayed, {});
      const index = columnsDisplayed.indexOf(columnKey);
      const isColumnDisplayed = (index > -1);

      if (isColumnDisplayed) {
        columnsDisplayed.splice(index, 1);
      } else {
        columnsDisplayed.push(columnKey);
      }

      Cookies.set("columnsDisplayed", columnsDisplayed);

      this.setState({ columnsDisplayed: columnsDisplayed });
    },

    renderColumnSelect (columnKey) {
      const columnKeysToNames = this.columnKeysToNames();
      const columnName = columnKeysToNames[columnKey];

      const onToggleColumn = this.toggleColumn.bind(null, columnKey);

      const columnsDisplayed = this.state.columnsDisplayed;
      const isColumnDisplayed = (columnsDisplayed.indexOf(columnKey) > -1);

      if (isColumnDisplayed) return (
        <div key={columnKey}>
          <input type="checkbox" defaultChecked onClick={onToggleColumn}/>
          <label>{columnName}</label>
        </div>
      );

      return (
        <div key={columnKey}>
          <input type="checkbox" onClick={onToggleColumn}/>
          <label>{columnName}</label>
        </div>
      );
    },

    renderColumnSelectors () {
      const columnKeys = this.columnKeys();

      return columnKeys.map((key) => { return this.renderColumnSelect(key) });
    },

    renderColumnPickerMenu () {
      if (this.state.showColumnPicker === false) return null;

      return (
        <div id="column-picker">
          <p>
            Select columns
            <span className="close" onClick={this.closeColumnPicker}>
              close
            </span>
          </p>
          <form id="column-listing">
            <div id="column-template">
              {this.renderColumnSelectors()}
            </div>
          </form>
        </div>
      );
    }

  });
})(window);

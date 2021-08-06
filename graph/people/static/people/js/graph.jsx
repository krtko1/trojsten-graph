import React from 'react';
import ReactDOM from 'react-dom';
import Fuse from 'fuse.js';
import noUiSlider from './nouislider.min';
import {enums, labels} from "./graph_enums";
import {
    dateToString,
    GraphFilter,
    GraphRenderer,
    GraphSimulation,
    normalizeString,
    prepend,
    preprocessGraph
} from './graph_utils';

class PersonDetail extends React.Component {

    listMemberships = (name, memberships) =>
        <div>
            <h4>{name}</h4>
            <ul>
                {memberships.map((membership) =>
                    <li key={membership.group_name}>
                        <b>{membership.group_name} from {dateToString(membership.date_started)} to {dateToString(membership.date_ended)}</b>
                    </li>
                )}
            </ul>
        </div>;

    render() {
        const person = this.props.person;

        const school_categories = [enums.Categories.elementarySchool, enums.Categories.highSchool, enums.Categories.university];
        const school_memberships = person.memberships.filter((membership) => school_categories.includes(membership.group_category));
        const seminar_memberships = person.memberships.filter((membership) => membership.group_category === enums.Categories.seminar);
        const other_memberships = person.memberships.filter((membership) => membership.group_category === enums.Categories.other);
        return (
            <div className='info-sidebar'>
                <div>
                    <h2>{person.first_name} {person.last_name}</h2>
                </div>
                <div>
                    <ul>
                        {person.nickname && <li><b>Nickname: {person.nickname}</b></li>}
                        <li><b>Born on {dateToString(new Date(person.birth_date))}</b></li>
                        {person.death_date && <li><b>Died on {dateToString(new Date(person.death_date))}</b></li>}
                    </ul>
                </div>
                {seminar_memberships.length > 0 && this.listMemberships('Seminar memberships', seminar_memberships)}
                {school_memberships.length > 0 && this.listMemberships('School memberships', school_memberships)}
                {other_memberships.length > 0 && this.listMemberships('Other memberships', other_memberships)}
            </div>
        )
    }
}

class RelationshipDetail extends React.Component {
    render() {
        return (
            <div className='info-sidebar'>
                <h2>{this.props.firstPerson.displayProps.label} & {this.props.secondPerson.displayProps.label}</h2>
                <div>
                    <ul>
                        {this.props.relationship.statuses.map((status, i) =>
                            <li key={i}>
                                <b>{labels.StatusChoices[status.status]} from {dateToString(status.date_start)} to {dateToString(status.date_end)}</b>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        )
    }
}

class GraphFilterPanel extends React.Component {
    constructor(props) {
        super(props);
        this.filter = props.filter;
        this.state = this.filter.getFilterOptions().reduce((acc, option) => {
            acc[option.name] = option.value;
            return acc
        }, {})
    }

    handleInputChange = (event) => {
        this.setState({
            [event.target.name]: event.target.checked
        });
        this.filter.updateFilterValue(event.target.name, event.target.checked)
    };

    inputGroup = (label, optionGroup) =>
        <div key={label} className='filter-group'>
            <h4>{label}</h4>
            <table className='table-borderless'>
                <tbody>
                {optionGroup.map((options, i) =>
                    <tr key={i}>
                        {options.map((option) =>
                            <td key={option.name}>
                                <input key={option.name} type='checkbox'
                                       checked={this.state[option.name] === true ? 'checked' : ''}
                                       name={option.name} onChange={this.handleInputChange} id={option.name}
                                />
                                <label htmlFor={option.name}><b>{option.label}</b></label>
                            </td>
                        )}
                    </tr>
                )}
                </tbody>
            </table>
        </div>;

    render() {
        const peopleFilters = this.filter.getFilterOptions('isKSP', 'isKMS', 'isFKS', 'notTrojsten', 'isIsolated').map(arr => [arr]);
        const relationshipFilters = [
            this.filter.getFilterOptions('isCurrentSerious', 'isOldSerious'),
            this.filter.getFilterOptions('isCurrentRumour', 'isOldRumour'),
            this.filter.getFilterOptions('isBloodBound'),
        ];
        return <div>
            <h3>Filters</h3>
            {this.inputGroup('People', peopleFilters)}
            {this.inputGroup('Relationships', relationshipFilters)}
        </div>
    }
}

class GraphSearch extends React.Component {
    constructor(props) {
        super(props);

        this.options = {
            shouldSort: true,
            threshold: 0.1,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                'searchAttributes.first_name',
                'searchAttributes.last_name',
                'searchAttributes.nickname',
                'searchAttributes.maiden_name'
            ]
        };
        this.pulse = null;
        this.pulseTimeout = null;
    }

    search = (e) => {
        if (e.key === 'Enter') {
            const simulation = this.props.parent.simulation;
            const renderer = this.props.parent.renderer;
            const results = new Fuse(simulation.nodes, this.options).search(normalizeString(this.refs.search_query.value));
            if (results.length === 0) return;
            simulation.nodes.forEach((node) => {
                node.isSearchResult = false
            });
            results.forEach((node) => {
                node.isSearchResult = true
            });

            clearInterval(this.pulse);
            clearTimeout(this.pulseTimeout);
            renderer.resetPulse();

            this.pulse = setInterval(() => {
                renderer.pulseSearchResults();
                simulation.update()
            }, 30);
            this.pulseTimeout = setTimeout(() => {
                clearInterval(this.pulse);
                renderer.resetPulse();
                simulation.update()
            }, 5000)
        }
    };

    render() {
        return (
            <div>
                <h3>Find in graph</h3>
                <input ref="search_query" type='text' onKeyDown={this.search}/>
            </div>
        )
    }
}


class GraphTimelinePanel extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        const slider = document.getElementById('time-setter');
        let event_dates = this.props.graph.edges.map((edge) => edge.statuses.map(status => [status.date_start, status.date_end])).flat(2);
        event_dates.push(new Date());
        event_dates = [...new Set(event_dates)].filter(x => x !== null).sort((a, b) => a - b);

        let ranges = {};
        let min_date = event_dates[0].getTime(), max_date = event_dates[event_dates.length - 1].getTime();
        if (event_dates.length > 2) {
            event_dates.slice(1, -1).reduce((ranges, date) => {
                const percentage = ((date - min_date) / (max_date - min_date)) * 100;
                ranges[percentage + '%'] = date.getTime();
                return ranges
            }, ranges);
        }
        ranges['min'] = min_date;
        ranges['max'] = max_date;
        noUiSlider.create(slider, {
            start: max_date,
            snap: true,
            connect: 'lower',
            tooltips: {
                from: Number,
                to: (ts) => dateToString(new Date(+ts))
            },
            range: ranges,
        });
        const self = this;
        slider.noUiSlider.on('update', function (values, handle) {
            self.props.onChange(new Date(+values[handle]));
        });

    }

    render() {
        return (
            <div className='timeline-panel'>
                <div id='time-setter'></div>
            </div>
        )
    }
}


class TrojstenGraph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedPeople: [],
            width: window.innerWidth,
            height: window.innerHeight,
        };

        this.filter = new GraphFilter(props.graph);
    }

    getRelationship = (firstPerson, secondPerson) => {
        return this.props.graph.edges.find((edge) =>
            (edge.source === firstPerson && edge.target === secondPerson) || (edge.source === secondPerson && edge.target === firstPerson)
        )
    };

    setData = (graph) => {
        this.simulation.setData(graph);
        this.renderer.setData(graph);
    };

    componentDidMount() {
        window.addEventListener('resize', this.updateDimensions);
        this.canvas = this.refs.canvas;
        this.searchInput = this.refs.search_query;
        this.renderer = new GraphRenderer(this.canvas);
        this.simulation = new GraphSimulation(this.canvas);
        this.simulation.render = this.renderer.renderGraph;
        this.filter.onFilterUpdate((graph) => this.setData(graph));
        this.filter.setCurrentTime(new Date())
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    updateDimensions = () => {
        this.setState({width: window.innerWidth, height: window.innerHeight});
        this.simulation.update();
    };

    canvasClick = (e) => {
        const clickedNode = this.simulation.nodeOnMousePosition(e.clientX, e.clientY);
        let selectedNodes = clickedNode ? prepend(this.state.selectedPeople, clickedNode).slice(0, 2) : [];
        this.setState({
            selectedPeople: selectedNodes
        });
        this.props.graph.nodes.forEach((node) => {
            node.displayProps.selected = selectedNodes.includes(node)
        });
        this.simulation.update();
    };

    search = (e) => {
        this.props.graph.nodes.forEach((node) => {
            node.isSearchResult = false
        });
        this.fuse.search(this.searchInput.value.normalize('NFD')).forEach((node) => {
            node.isSearchResult = true
        });
        const start = Date.now();
        const self = this;

        function pulseSearchResults() {
            self.simulation.update();
            if (Date.now() - start < 3000) {
                requestAnimationFrame(pulseSearchResults);
            } else {
                self.props.graph.nodes.forEach((node) => {
                    node.isSearchResult = false;
                });
                self.simulation.update();
            }
        }

        pulseSearchResults();
    };

    canvasMouseMove = (e) => {
        const target = this.simulation.nodeOnMousePosition(e.clientX, e.clientY);
        if (target) {
            this.renderer.highlightNode(target);
            this.canvas.style.cursor = 'pointer'
        } else {
            this.renderer.highlightNode(target);
            this.canvas.style.cursor = 'default'
        }
        this.simulation.update();
    };

    getSidebar = () => {
        let sidebarContent = () => {
            let firstPerson = this.state.selectedPeople[0],
                secondPerson = this.state.selectedPeople[1],
                relationship;
            if (firstPerson) {
                if (secondPerson && (relationship = this.getRelationship(firstPerson, secondPerson))) {
                    return <RelationshipDetail
                        firstPerson={firstPerson}
                        secondPerson={secondPerson}
                        relationship={relationship}
                    />
                }
                return <PersonDetail person={firstPerson}/>
            }
        };
        const content = sidebarContent();
        if (content) {
            return (
                <div className="row h-100 info-sidebar">
                    <div className="col-sm-12 my-auto sidebar-container">
                        {sidebarContent()}
                    </div>
                </div>
            )
        }
    };

    getToolbar = () => {
        return (
            <div className="row h-100 graph-toolbar">
                <div className="col-sm-12 my-auto">
                    <div className='tool-container'>
                        <GraphSearch parent={this}/>
                        <GraphFilterPanel filter={this.filter}/>
                    </div>
                </div>
            </div>
        )
    };

    render() {
        return (
            <div>
                <canvas tabIndex="1" ref="canvas" width={this.state.width} height={this.state.height}
                        onClick={this.canvasClick} onMouseMove={this.canvasMouseMove}>
                </canvas>
                {this.getToolbar()}
                <GraphTimelinePanel graph={this.props.graph} onChange={(e) => {
                    this.filter.setCurrentTime(e)
                }}/>
                {this.getSidebar()}
            </div>
        )
    }
}

function initializeGraph(graph) {
    preprocessGraph(graph);
    ReactDOM.render(
        <TrojstenGraph graph={graph}/>,
        document.getElementById('container')
    );
}

const request = new XMLHttpRequest();
request.overrideMimeType("application/json");
request.open('GET', graph_data_url, true);
request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
        initializeGraph(JSON.parse(request.responseText));
    }
};
request.send(null);

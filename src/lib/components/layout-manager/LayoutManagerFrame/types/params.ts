type Params = {
    reelType: string;
    disabledParameters: string[];
    scope: string;
    relatedScope: string;
    type: string;
    layoutProfileId: string;
    editable: boolean;
    layout: any;
    dataAttributeList: string[];
    dataAttributesDefs: any;
    allowSwitch: boolean;
    fieldTypes: string[];
    openEditLabelDialog: Function;
    onlyManyToMany: boolean;
}

export default Params;
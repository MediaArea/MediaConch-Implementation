/*  Copyright (c) MediaArea.net SARL. All Rights Reserved.
 *
 *  Use of this source code is governed by a GPLv3+/MPLv2+ license that can
 *  be found in the License.html file in the root of the source tree.
 */

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Policies functions
//
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//---------------------------------------------------------------------------
#ifndef UnknownPolicyH
#define UnknownPolicyH
//---------------------------------------------------------------------------

//---------------------------------------------------------------------------
#include <list>
#include <vector>
#include <libxml/tree.h>
#include "Policy.h"
//---------------------------------------------------------------------------

namespace MediaConch {

//***************************************************************************
// Policy
//***************************************************************************

class UnknownPolicy : public Policy
{
public:
    UnknownPolicy(bool no_https) : Policy(Policies::POLICY_UNKNOWN, no_https), system_doc(NULL) {}
    UnknownPolicy(const UnknownPolicy*);
    virtual          ~UnknownPolicy();
    xmlDocPtr         create_doc();

private:
    // HELPER
    int import_schema_from_doc(xmlDocPtr doc, const std::string& filename);
    xmlDocPtr         system_doc;
};

}

#endif

/*  Copyright (c) MediaArea.net SARL. All Rights Reserved.
 *
 *  Use of this source code is governed by a GPLv3+/MPLv2+ license that can
 *  be found in the License.html file in the root of the source tree.
 */

#ifndef POLICIESEDIT_H
#define POLICIESEDIT_H

//---------------------------------------------------------------------------
#ifdef MEDIAINFO_DLL_RUNTIME
    #include "MediaInfoDLL/MediaInfoDLL.h"
    #define MediaInfoNameSpace MediaInfoDLL
#elif defined MEDIAINFO_DLL_STATIC
    #include "MediaInfoDLL/MediaInfoDLL_Static.h"
    #define MediaInfoNameSpace MediaInfoDLL
#else
    #include "MediaInfo/MediaInfoList.h"
    #define MediaInfoNameSpace MediaInfoLib
#endif
#include <QFrame>
#include <QStandardItem>
#include <list>
using namespace MediaInfoNameSpace;
using namespace std;

namespace Ui {
    class PoliciesEdit;
}

class QPushButton;
struct Rule;
class MainWindow;
class QDialogButtonBox;

class PoliciesEdit : public QFrame
{
    Q_OBJECT

public:
    explicit PoliciesEdit(QWidget *parent = 0, string policy = string());
    ~PoliciesEdit();

    
//***************************************************************************
// Functions
//***************************************************************************

void clear();
void add_error(String error);
void show_errors();
void clear_errors();
void add_rule(Rule *r);
string get_old_name() const;
string get_new_name() const;

//***************************************************************************
// Visual element
//***************************************************************************

const QPushButton *get_newRule_button() const;
const QDialogButtonBox *get_validation_button() const;

private:
    MainWindow *mainwindow;
    Ui::PoliciesEdit *ui;
    list<String> errors;
    string policyName;

//***************************************************************************
// HELPER
//***************************************************************************

QString getSelectedRuleName();
void add_values_to_selector();

//***************************************************************************
// Slots
//***************************************************************************

private Q_SLOTS:
    void on_addNewRule();
    void cell_double_clicked(int row, int column);
    void on_deleteRule();
    void rule_selected_changed();
};

#endif // POLICIESEDIT_H
/*  Copyright (c) MediaArea.net SARL. All Rights Reserved.
 *
 *  Use of this source code is governed by a GPLv3+/MPLv2+ license that can
 *  be found in the License.html file in the root of the source tree.
 */

#ifndef DaemonH
#define DaemonH

//---------------------------------------------------------------------------
#include <string>
#include <vector>
#include "MediaInfo/MediaInfo.h"
#include "Common/MediaConchLib.h"
#include "Common/REST_API.h"

//***************************************************************************
// Daemon
//***************************************************************************

namespace MediaConch
{
    class Httpd;

    //--------------------------------------------------------------------------
    class Daemon
    {
      public:
        Daemon();
        ~Daemon();

        int parse_args(int ac, char** av);
        int init();
        int run();
        int finish();

      private:
        Daemon(const Daemon&);
        Daemon& operator=(const Daemon&);

        MediaConchLib *MCL;
        bool           is_daemon;
        Httpd         *httpd;

        // Helper
        int daemonize();

        // Parse option helper
        int parse(std::string& argument);
        int parse_help(const std::string& argument);
        int parse_fork(const std::string& argument);
        int parse_other(const std::string& argument);

        // Request received callbacks
        static int on_analyze_command(const RESTAPI::Analyze_Req* req,
                                    RESTAPI::Analyze_Res& res, void *arg);
        static int on_status_command(const RESTAPI::Status_Req* req,
                                     RESTAPI::Status_Res& res, void *arg);
        static int on_report_command(const RESTAPI::Report_Req* req,
                                     RESTAPI::Report_Res& res, void *arg);
        static int on_retry_command(const RESTAPI::Retry_Req* req,
                                    RESTAPI::Retry_Res& res, void *arg);
        static int on_clear_command(const RESTAPI::Clear_Req* req,
                                    RESTAPI::Clear_Res& res, void *arg);

        size_t get_first_free_slot();
        bool id_is_existing(int id) const;

        std::vector<std::string*> current_files;
    };

}

#endif